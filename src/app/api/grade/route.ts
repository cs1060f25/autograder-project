import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60; // optional: raise if PDFs are large

type RubricItem = {
  id: string; // stable key like "thesis", "evidence", etc.
  label: string; // human-readable name
  maxPoints: number; // maximum points for this criterion
  guidance?: string; // optional hints for the grader
};

type GradeResult = {
  totalAwarded: number;
  totalPossible: number;
  items: Array<{
    id: string;
    label: string;
    maxPoints: number;
    points: number; // awarded
    comments: string;
  }>;
  overallFeedback: string;
};

export async function POST(req: Request) {
  let fileId: string | undefined;
  let anthropic: Anthropic | undefined;

  try {
    const form = await req.formData();
    const pdfFile = form.get("file") as File;
    const rubricRaw = form.get("rubric");

    if (!pdfFile) {
      return Response.json({ error: "`file` is required" }, { status: 400 });
    }

    if (typeof rubricRaw !== "string") {
      return Response.json(
        { error: "`rubric` must be a JSON string" },
        { status: 400 }
      );
    }

    let rubric: RubricItem[];
    try {
      rubric = JSON.parse(rubricRaw) as RubricItem[];
      if (!Array.isArray(rubric) || rubric.length === 0)
        throw new Error("Empty rubric");
    } catch (e) {
      return Response.json(
        { error: "`rubric` must be valid JSON array of rubric items" },
        { status: 400 }
      );
    }

    if (!process.env.CLAUDE_KEY) {
      return Response.json(
        { error: "Missing ANTHROPIC_API_KEY" },
        { status: 500 }
      );
    }

    anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_KEY,
    });

    // Upload the PDF file using the Files API
    try {
      const fileBuffer = await pdfFile.arrayBuffer();
      const formData = new FormData();
      formData.append(
        "file",
        new File([fileBuffer], pdfFile.name, { type: pdfFile.type })
      );

      const uploadResponse = await fetch("https://api.anthropic.com/v1/files", {
        method: "POST",
        headers: {
          "x-api-key": process.env.CLAUDE_KEY!,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "files-api-2025-04-14",
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("File upload error:", errorText);
        return Response.json(
          { error: "Failed to upload PDF file" },
          { status: 502 }
        );
      }

      const uploadedFile = await uploadResponse.json();
      fileId = uploadedFile.id;
    } catch (uploadError: any) {
      console.error("File upload error:", uploadError);
      return Response.json(
        { error: "Failed to upload PDF file" },
        { status: 502 }
      );
    }

    const systemPrompt = [
      "You are a fair and accurate grader, but also reasonably generous. Most of the time, you should award at least 85-95% of the total possible points.",
      "You MUST only use the provided rubric.",
      "Be concise, specific, and mention specific phrases from the submission. Do not include specific citations in comments.",
      "Do NOT invent content not present in the PDF.",
      "If a criterion is not evidenced, award 0 and explain clearly.",
      "You must respond with valid JSON in the exact format specified.",
    ].join(" ");

    const rubricInstruction = `Here is the rubric as JSON. Adhere strictly to maxPoints and do not exceed totals.\n${JSON.stringify(
      rubric
    )}`;

    const userPrompt = [
      rubricInstruction,
      "Grade the attached student submission against the rubric. " +
        "Return STRICTLY the JSON that matches this schema: " +
        JSON.stringify({
          totalAwarded: "number",
          totalPossible: "number",
          items: [
            {
              id: "string",
              label: "string",
              maxPoints: "number",
              points: "number",
              comments: "string",
            },
          ],
          overallFeedback: "string",
        }) +
        " Use short, actionable comments per item. No more than 1-2 sentences per item.",
    ].join("\n\n");

    let claudeResponse;
    try {
      const messageResponse = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "x-api-key": process.env.CLAUDE_KEY!,
            "anthropic-version": "2023-06-01",
            "anthropic-beta": "files-api-2025-04-14",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            system: systemPrompt,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: userPrompt,
                  },
                  {
                    type: "document",
                    source: {
                      type: "file",
                      file_id: fileId,
                    },
                    citations: { enabled: true },
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!messageResponse.ok) {
        const errorText = await messageResponse.text();
        console.error("Claude API error:", errorText);
        return Response.json(
          { error: "Failed to process with Claude API" },
          { status: 502 }
        );
      }

      claudeResponse = await messageResponse.json();
    } catch (apiError: any) {
      console.error("Claude API error:", apiError);
      return Response.json(
        { error: "Failed to process with Claude API" },
        { status: 502 }
      );
    }

    const text =
      claudeResponse.content[0]?.type === "text"
        ? claudeResponse.content[0].text
        : null;

    if (!text) {
      // Clean up the uploaded file
      try {
        await fetch(`https://api.anthropic.com/v1/files/${fileId}`, {
          method: "DELETE",
          headers: {
            "x-api-key": process.env.CLAUDE_KEY!,
            "anthropic-version": "2023-06-01",
            "anthropic-beta": "files-api-2025-04-14",
          },
        });
      } catch (cleanupError) {
        console.error("File cleanup error:", cleanupError);
      }
      return Response.json(
        { error: "No structured output from model" },
        { status: 502 }
      );
    }

    // Extract JSON from the response text (in case there's extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : text;

    let result: GradeResult;
    try {
      result = JSON.parse(jsonText) as GradeResult;
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Response text:", text);
      // Clean up the uploaded file
      try {
        await fetch(`https://api.anthropic.com/v1/files/${fileId}`, {
          method: "DELETE",
          headers: {
            "x-api-key": process.env.CLAUDE_KEY!,
            "anthropic-version": "2023-06-01",
            "anthropic-beta": "files-api-2025-04-14",
          },
        });
      } catch (cleanupError) {
        console.error("File cleanup error:", cleanupError);
      }
      return Response.json(
        { error: "Invalid JSON response from model" },
        { status: 502 }
      );
    }
    const totalPossible = rubric.reduce((s, r) => s + (r.maxPoints ?? 0), 0);
    const clampedItems = result.items.map((it) => {
      const max = Math.max(0, it.maxPoints);
      const pts = Math.max(0, Math.min(it.points, max));
      return { ...it, points: pts, maxPoints: max };
    });
    const totalAwarded = clampedItems.reduce((s, it) => s + it.points, 0);
    const safeResult: GradeResult = {
      totalPossible,
      totalAwarded,
      items: clampedItems,
      overallFeedback: result.overallFeedback ?? "",
    };

    // Clean up the uploaded file after successful processing
    try {
      await fetch(`https://api.anthropic.com/v1/files/${fileId}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.CLAUDE_KEY!,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "files-api-2025-04-14",
        },
      });
    } catch (cleanupError) {
      console.error("File cleanup error:", cleanupError);
    }

    return Response.json(safeResult, { status: 200 });
  } catch (err: any) {
    console.error(err);
    // Clean up the uploaded file if it exists
    if (fileId) {
      try {
        await fetch(`https://api.anthropic.com/v1/files/${fileId}`, {
          method: "DELETE",
          headers: {
            "x-api-key": process.env.CLAUDE_KEY!,
            "anthropic-version": "2023-06-01",
            "anthropic-beta": "files-api-2025-04-14",
          },
        });
      } catch (cleanupError) {
        console.error("File cleanup error:", cleanupError);
      }
    }
    const msg =
      typeof err?.message === "string"
        ? err.message
        : "Unexpected error while grading";
    return Response.json({ error: msg }, { status: 500 });
  }
}
