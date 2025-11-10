/**
 * Mock Grading Provider
 * 
 * This provider simulates AI grading without making actual API calls.
 * Useful for testing and development.
 */

import {
  IGradingProvider,
  GradeRequest,
  GradeResult,
  GradeItem,
} from "../types";

export interface MockGradingProviderConfig {
  /**
   * Percentage of total points to award (0-1)
   * Default: 0.85 (85%)
   */
  scorePercentage?: number;

  /**
   * Delay in milliseconds to simulate API latency
   * Default: 500ms
   */
  simulatedDelay?: number;

  /**
   * Whether to add random variation to scores
   * Default: true
   */
  addVariation?: boolean;

  /**
   * Whether to simulate failures
   * Default: false
   */
  simulateFailure?: boolean;

  /**
   * Failure rate (0-1) if simulateFailure is true
   * Default: 0.1 (10%)
   */
  failureRate?: number;
}

/**
 * Mock grading provider that generates realistic but simulated grades
 */
export class MockGradingProvider implements IGradingProvider {
  private config: Required<MockGradingProviderConfig>;

  constructor(config: MockGradingProviderConfig = {}) {
    this.config = {
      scorePercentage: config.scorePercentage ?? 0.85,
      simulatedDelay: config.simulatedDelay ?? 500,
      addVariation: config.addVariation ?? true,
      simulateFailure: config.simulateFailure ?? false,
      failureRate: config.failureRate ?? 0.1,
    };
  }

  async grade(request: GradeRequest): Promise<GradeResult> {
    // Simulate API delay
    await this.delay(this.config.simulatedDelay);

    // Simulate failures if configured
    if (this.config.simulateFailure && Math.random() < this.config.failureRate) {
      throw new Error("Mock grading provider: Simulated failure");
    }

    // Validate request
    if (!request.fileUrl) {
      throw new Error("File URL is required");
    }

    if (!request.rubric || request.rubric.length === 0) {
      throw new Error("Rubric is required and cannot be empty");
    }

    // Calculate total possible points
    const totalPossible = request.rubric.reduce(
      (sum, item) => sum + item.maxPoints,
      0
    );

    // Generate grades for each criterion
    const items: GradeItem[] = request.rubric.map((rubricItem) => {
      // Calculate base points
      let points = Math.round(rubricItem.maxPoints * this.config.scorePercentage);

      // Add random variation if configured
      if (this.config.addVariation) {
        const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        points = Math.max(0, Math.min(rubricItem.maxPoints, points + variation));
      }

      // Generate contextual feedback
      const comments = this.generateFeedback(rubricItem.label, points, rubricItem.maxPoints);

      return {
        id: rubricItem.id,
        label: rubricItem.label,
        maxPoints: rubricItem.maxPoints,
        points,
        comments,
      };
    });

    // Calculate total awarded
    const totalAwarded = items.reduce((sum, item) => sum + item.points, 0);

    // Generate overall feedback
    const percentage = (totalAwarded / totalPossible) * 100;
    const overallFeedback = this.generateOverallFeedback(percentage, items);

    return {
      totalAwarded,
      totalPossible,
      items,
      overallFeedback,
    };
  }

  getName(): string {
    return "MockGradingProvider";
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Generate contextual feedback based on criterion name and score
   */
  private generateFeedback(criterionName: string, points: number, maxPoints: number): string {
    const percentage = (points / maxPoints) * 100;

    const feedbackTemplates = {
      high: [
        `Excellent work on ${criterionName.toLowerCase()}. You demonstrated strong understanding.`,
        `Great job with ${criterionName.toLowerCase()}! Your approach was thorough and well-executed.`,
        `Outstanding ${criterionName.toLowerCase()}. You exceeded expectations in this area.`,
      ],
      medium: [
        `Good work on ${criterionName.toLowerCase()}. There's room for improvement in some areas.`,
        `Solid ${criterionName.toLowerCase()}. Consider adding more detail to strengthen your work.`,
        `Nice job with ${criterionName.toLowerCase()}. A few enhancements would make it even better.`,
      ],
      low: [
        `${criterionName} needs more work. Review the rubric guidelines and revise accordingly.`,
        `Your ${criterionName.toLowerCase()} could be strengthened. Consider the key requirements.`,
        `More attention needed on ${criterionName.toLowerCase()}. Focus on the core concepts.`,
      ],
    };

    let templates: string[];
    if (percentage >= 85) {
      templates = feedbackTemplates.high;
    } else if (percentage >= 70) {
      templates = feedbackTemplates.medium;
    } else {
      templates = feedbackTemplates.low;
    }

    // Select a random template
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate overall feedback based on total score
   */
  private generateOverallFeedback(percentage: number, items: GradeItem[]): string {
    let feedback = "";

    if (percentage >= 90) {
      feedback = "Excellent work overall! You demonstrated strong mastery of the material.";
    } else if (percentage >= 80) {
      feedback = "Good work! You showed solid understanding with room for minor improvements.";
    } else if (percentage >= 70) {
      feedback = "Satisfactory work. There are several areas that could be strengthened.";
    } else if (percentage >= 60) {
      feedback = "Your submission shows basic understanding but needs significant improvement.";
    } else {
      feedback = "Your submission needs substantial revision. Please review the rubric carefully.";
    }

    // Add specific areas for improvement
    const weakAreas = items
      .filter((item) => (item.points / item.maxPoints) < 0.7)
      .map((item) => item.label);

    if (weakAreas.length > 0) {
      feedback += ` Focus on improving: ${weakAreas.join(", ")}.`;
    }

    return feedback;
  }

  /**
   * Simulate async delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update configuration at runtime
   */
  public updateConfig(config: Partial<MockGradingProviderConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}

