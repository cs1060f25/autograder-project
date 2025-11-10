/**
 * Grading Service Types
 * 
 * This module defines the core types and interfaces for the grading service.
 */

/**
 * A single rubric criterion for grading
 */
export interface RubricItem {
  id: string;           // Stable key like "thesis", "evidence", etc.
  label: string;        // Human-readable name
  maxPoints: number;    // Maximum points for this criterion
  guidance?: string;    // Optional hints for the grader
}

/**
 * The result of grading a single criterion
 */
export interface GradeItem {
  id: string;           // Matches RubricItem.id
  label: string;        // Matches RubricItem.label
  maxPoints: number;    // Maximum points possible
  points: number;       // Points awarded
  comments: string;     // Feedback for this criterion
}

/**
 * Complete grading result for a submission
 */
export interface GradeResult {
  totalAwarded: number;      // Total points awarded
  totalPossible: number;     // Total points possible
  items: GradeItem[];        // Individual criterion results
  overallFeedback: string;   // General feedback for the submission
}

/**
 * Request to grade a submission
 */
export interface GradeRequest {
  fileUrl: string;      // Public URL to the PDF file
  rubric: RubricItem[]; // Rubric to grade against
}

/**
 * Interface for grading providers (OpenAI, Mock, etc.)
 */
export interface IGradingProvider {
  /**
   * Grade a submission based on a rubric
   * @param request The grading request
   * @returns The grading result
   * @throws Error if grading fails
   */
  grade(request: GradeRequest): Promise<GradeResult>;

  /**
   * Get the name of the provider
   */
  getName(): string;

  /**
   * Check if the provider is available (e.g., API keys configured)
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Configuration for the grading service
 */
export interface GradingServiceConfig {
  provider: IGradingProvider;
  maxRetries?: number;
  retryDelay?: number;
}

