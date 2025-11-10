import {
  GradingService,
  OpenAIGradingProvider,
  MockGradingProvider,
  RubricItem,
  GradeResult,
} from "@/services/grading";

export const maxDuration = 60; // optional: raise if PDFs are large

/**
 * Grade API endpoint
 * 
 * This endpoint accepts a PDF URL and rubric, then returns grading results.
 * It uses the GradingService abstraction which supports multiple providers.
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const pdfUrl = form.get("file");
    const rubricRaw = form.get("rubric");
    const useMock = form.get("useMock"); // Optional: for testing

    // Validate rubric parameter
    if (typeof rubricRaw !== "string") {
      return Response.json(
        { error: "`rubric` must be a JSON string" },
        { status: 400 }
      );
    }

    // Parse rubric
    let rubric: RubricItem[];
    try {
      rubric = JSON.parse(rubricRaw) as RubricItem[];
      if (!Array.isArray(rubric) || rubric.length === 0) {
        throw new Error("Empty rubric");
      }
    } catch (e) {
      return Response.json(
        { error: "`rubric` must be valid JSON array of rubric items" },
        { status: 400 }
      );
    }

    // Validate file URL
    if (typeof pdfUrl !== "string" || !pdfUrl) {
      return Response.json(
        { error: "`file` must be a valid URL string" },
        { status: 400 }
      );
    }

    // Choose provider based on configuration or request parameter
    let provider;
    if (useMock === "true" || process.env.USE_MOCK_GRADING === "true") {
      // Use mock provider for testing/development
      provider = new MockGradingProvider({
        scorePercentage: 0.85,
        simulatedDelay: 1000,
        addVariation: true,
      });
    } else {
      // Use OpenAI provider for production
      if (!process.env.OPENAI_KEY) {
        return Response.json(
          { error: "Missing OPENAI_KEY configuration" },
          { status: 500 }
        );
      }
      provider = new OpenAIGradingProvider({
        apiKey: process.env.OPENAI_KEY,
        model: "gpt-5-mini",
      });
    }

    // Create grading service
    const gradingService = new GradingService({
      provider,
      maxRetries: 3,
      retryDelay: 1000,
    });

    // Check if service is ready
    const isReady = await gradingService.isReady();
    if (!isReady) {
      return Response.json(
        { error: `Grading provider ${gradingService.getProviderName()} is not available` },
        { status: 503 }
      );
    }

    // Grade the submission
    const result: GradeResult = await gradingService.grade({
      fileUrl: pdfUrl,
      rubric,
    });

    return Response.json(result, { status: 200 });
  } catch (err: any) {
    console.error("Grading API error:", err);
    const msg =
      typeof err?.message === "string"
        ? err.message
        : "Unexpected error while grading";
    return Response.json({ error: msg }, { status: 500 });
  }
}
