/**
 * OpenAI Grading Provider
 * 
 * This provider uses OpenAI's API to grade submissions.
 */

import OpenAI from "openai";
import {
  IGradingProvider,
  GradeRequest,
  GradeResult,
} from "../types";

export interface OpenAIGradingProviderConfig {
  /**
   * OpenAI API key
   */
  apiKey?: string;

  /**
   * Model to use for grading
   * Default: "gpt-5-mini"
   */
  model?: string;

  /**
   * System prompt for the grader
   */
  systemPrompt?: string;

  /**
   * Maximum retries for API calls
   * Default: 3
   */
  maxRetries?: number;
}

/**
 * Grading provider that uses OpenAI's API
 */
export class OpenAIGradingProvider implements IGradingProvider {
  private client: OpenAI;
  private config: Required<OpenAIGradingProviderConfig>;

  constructor(config: OpenAIGradingProviderConfig = {}) {
    const apiKey = config.apiKey || process.env.OPENAI_KEY;
    
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }

    this.client = new OpenAI({ apiKey });
    
    this.config = {
      apiKey,
      model: config.model || "gpt-5-mini",
      systemPrompt: config.systemPrompt || this.getDefaultSystemPrompt(),
      maxRetries: config.maxRetries ?? 3,
    };
  }

  async grade(request: GradeRequest): Promise<GradeResult> {
    // Validate request
    if (!request.fileUrl) {
      throw new Error("File URL is required");
    }

    if (!request.rubric || request.rubric.length === 0) {
      throw new Error("Rubric is required and cannot be empty");
    }

    // Define JSON schema for structured output
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

    // Build rubric instruction
    const rubricInstruction = `Here is the rubric as JSON. Adhere strictly to maxPoints and do not exceed totals.\n${JSON.stringify(
      request.rubric
    )}`;

    try {
      // Call OpenAI API with structured output
      const response = await this.client.responses.create({
        model: this.config.model,
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
            content: [{ type: "input_text", text: this.config.systemPrompt }],
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
              { type: "input_file", file_url: request.fileUrl },
            ],
          },
        ],
      });

      const text = response.output_text;
      if (!text) {
        throw new Error("No structured output from model");
      }

      // Parse and validate the result
      const result = JSON.parse(text) as GradeResult;
      
      // Validate and clamp scores to rubric bounds
      return this.validateAndClampResult(result, request.rubric);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI grading failed: ${error.message}`);
      }
      throw new Error("OpenAI grading failed with unknown error");
    }
  }

  getName(): string {
    return "OpenAIGradingProvider";
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple check to see if API key is configured
      return !!this.config.apiKey;
    } catch {
      return false;
    }
  }

  /**
   * Get the default system prompt for grading
   */
  private getDefaultSystemPrompt(): string {
    return [
      "You are a fair and accurate grader, but also reasonably generous. Most of the time, you should award at least 85-95% of the total possible points.",
      "You MUST only use the provided rubric.",
      "Be concise, specific, and cite concrete issues from the submission.",
      "Do NOT invent content not present in the PDF.",
      "If a criterion is not evidenced, award 0 and explain clearly.",
    ].join(" ");
  }

  /**
   * Validate and clamp the grading result to ensure it meets constraints
   */
  private validateAndClampResult(
    result: GradeResult,
    rubric: { id: string; maxPoints: number }[]
  ): GradeResult {
    // Calculate total possible from rubric
    const totalPossible = rubric.reduce((sum, item) => sum + item.maxPoints, 0);

    // Validate and clamp each item
    const clampedItems = result.items.map((item) => {
      const rubricItem = rubric.find((r) => r.id === item.id);
      const maxPoints = rubricItem?.maxPoints ?? item.maxPoints;
      
      return {
        ...item,
        maxPoints: Math.max(0, maxPoints),
        points: Math.max(0, Math.min(item.points, maxPoints)),
      };
    });

    // Recalculate total awarded
    const totalAwarded = clampedItems.reduce((sum, item) => sum + item.points, 0);

    return {
      totalPossible,
      totalAwarded,
      items: clampedItems,
      overallFeedback: result.overallFeedback ?? "",
    };
  }
}

