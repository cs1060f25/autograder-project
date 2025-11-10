/**
 * Grading Service
 * 
 * Main service class for grading submissions.
 * Supports multiple providers (OpenAI, Mock, etc.) and handles retries.
 */

import {
  IGradingProvider,
  GradeRequest,
  GradeResult,
  GradingServiceConfig,
} from "./types";

export class GradingService {
  private provider: IGradingProvider;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: GradingServiceConfig) {
    this.provider = config.provider;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000; // 1 second
  }

  /**
   * Grade a submission with automatic retries on failure
   * @param request The grading request
   * @returns The grading result
   * @throws Error if all retries fail
   */
  async grade(request: GradeRequest): Promise<GradeResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Check if provider is available before attempting
        const isAvailable = await this.provider.isAvailable();
        if (!isAvailable) {
          throw new Error(`Provider ${this.provider.getName()} is not available`);
        }

        // Attempt to grade
        const result = await this.provider.grade(request);

        // Validate the result
        this.validateResult(result, request);

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        
        console.error(
          `Grading attempt ${attempt + 1}/${this.maxRetries} failed:`,
          lastError.message
        );

        // If this isn't the last retry, wait before trying again
        if (attempt < this.maxRetries - 1) {
          await this.delay(this.retryDelay * (attempt + 1)); // Exponential backoff
        }
      }
    }

    // All retries failed
    throw new Error(
      `Grading failed after ${this.maxRetries} attempts: ${lastError?.message || "Unknown error"}`
    );
  }

  /**
   * Grade multiple submissions in batch
   * @param requests Array of grading requests
   * @returns Array of results with success/failure status
   */
  async gradeBatch(
    requests: GradeRequest[]
  ): Promise<Array<{ success: boolean; result?: GradeResult; error?: string }>> {
    return Promise.all(
      requests.map(async (request) => {
        try {
          const result = await this.grade(request);
          return { success: true, result };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );
  }

  /**
   * Get the name of the current provider
   */
  getProviderName(): string {
    return this.provider.getName();
  }

  /**
   * Check if the grading service is ready to use
   */
  async isReady(): Promise<boolean> {
    try {
      return await this.provider.isAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Validate that a grading result meets expected constraints
   */
  private validateResult(result: GradeResult, request: GradeRequest): void {
    // Check that all rubric items have corresponding grade items
    if (result.items.length !== request.rubric.length) {
      throw new Error(
        `Result has ${result.items.length} items but rubric has ${request.rubric.length} items`
      );
    }

    // Check that all rubric IDs are present
    const rubricIds = new Set(request.rubric.map((item) => item.id));
    const resultIds = new Set(result.items.map((item) => item.id));
    
    for (const id of rubricIds) {
      if (!resultIds.has(id)) {
        throw new Error(`Missing grade for rubric item: ${id}`);
      }
    }

    // Check that points are within bounds
    for (const item of result.items) {
      if (item.points < 0 || item.points > item.maxPoints) {
        throw new Error(
          `Points for ${item.label} (${item.points}) must be between 0 and ${item.maxPoints}`
        );
      }
    }

    // Check that totals are correct
    const calculatedTotal = result.items.reduce(
      (sum, item) => sum + item.points,
      0
    );
    
    if (Math.abs(calculatedTotal - result.totalAwarded) > 0.01) {
      throw new Error(
        `Total awarded (${result.totalAwarded}) doesn't match sum of items (${calculatedTotal})`
      );
    }

    // Check that overall feedback is provided
    if (!result.overallFeedback || result.overallFeedback.trim() === "") {
      throw new Error("Overall feedback is required");
    }
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

