import OpenAI from "openai";

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
  try {
    const form = await req.formData();
    const pdfUrl = form.get("file");
    const rubricRaw = form.get("rubric");

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

    const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
    if (!process.env.OPENAI_KEY) {
      return Response.json({ error: "Missing OPENAI_KEY" }, { status: 500 });
    }

    const schema = {
      type: "object",
      additionalProperties: false,
      required: ["totalAwarded", "totalPossible", "items", "overallFeedback"],
      properties: {
        totalAwarded: { type: "number" },
        totalPossible: { type: "number" },
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "label", "maxPoints", "points", "comments"],
            properties: {
              id: { type: "string" },
              label: { type: "string" },
              maxPoints: { type: "number" },
              points: { type: "number" },
              comments: { type: "string" },
            },
          },
        },
        overallFeedback: { type: "string" },
      },
    };

    const systemPrompt = [
      "You are a fair and accurate grader, but also reasonably generous. Most of the time, you should award at least 85-95% of the total possible points.",
      "You MUST only use the provided rubric.",
      "Be concise, specific, and cite concrete issues from the submission.",
      "Do NOT invent content not present in the PDF.",
      "If a criterion is not evidenced, award 0 and explain clearly.",
    ].join(" ");

    const rubricInstruction = `Here is the rubric as JSON. Adhere strictly to maxPoints and do not exceed totals.\n${JSON.stringify(
      rubric
    )}`;

    const resp = await openai.responses.create({
      model: "gpt-5-mini",
      text: {
        format: {
          name: "GradeResult",
          type: "json_schema",
          strict: true,
          schema: schema,
        },
      },
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: rubricInstruction },
            {
              type: "input_text",
              text:
                "Grade the attached student submission against the rubric. " +
                "Return STRICTLY the JSON that matches the schema. " +
                "Use short, actionable comments per item. No more than 1-2 sentences per item.",
            },
            { type: "input_file", file_url: pdfUrl as string },
          ],
        },
      ],
    });

    const text = resp.output_text;
    if (!text) {
      return Response.json(
        { error: "No structured output from model" },
        { status: 502 }
      );
    }

    const result = JSON.parse(text) as GradeResult;
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
    return Response.json(safeResult, { status: 200 });
  } catch (err: any) {
    console.error(err);
    const msg =
      typeof err?.message === "string"
        ? err.message
        : "Unexpected error while grading";
    return Response.json({ error: msg }, { status: 500 });
  }
}
