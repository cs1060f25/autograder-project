/**
 * Unit tests for GradingService
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  GradingService,
  MockGradingProvider,
  IGradingProvider,
  GradeRequest,
  GradeResult,
} from "@/services/grading";

describe("GradingService", () => {
  let mockProvider: MockGradingProvider;
  let gradingService: GradingService;

  const sampleRubric = [
    {
      id: "clarity",
      label: "Clarity",
      maxPoints: 10,
      guidance: "Is the writing clear and easy to understand?",
    },
    {
      id: "accuracy",
      label: "Accuracy",
      maxPoints: 15,
      guidance: "Are the facts correct?",
    },
    {
      id: "organization",
      label: "Organization",
      maxPoints: 5,
      guidance: "Is the content well organized?",
    },
  ];

  const sampleRequest: GradeRequest = {
    fileUrl: "https://example.com/sample.pdf",
    rubric: sampleRubric,
  };

  beforeEach(() => {
    // Use MockProvider with no delay for faster tests
    mockProvider = new MockGradingProvider({
      scorePercentage: 0.85,
      simulatedDelay: 0,
      addVariation: false,
      simulateFailure: false,
    });

    gradingService = new GradingService({
      provider: mockProvider,
      maxRetries: 3,
      retryDelay: 100,
    });
  });

  describe("grade()", () => {
    it("should successfully grade a submission with mock provider", async () => {
      const result = await gradingService.grade(sampleRequest);

      expect(result).toBeDefined();
      expect(result.totalPossible).toBe(30); // 10 + 15 + 5
      expect(result.totalAwarded).toBeGreaterThan(0);
      expect(result.totalAwarded).toBeLessThanOrEqual(30);
      expect(result.items).toHaveLength(3);
      expect(result.overallFeedback).toBeTruthy();
    });

    it("should return correct rubric items with scores", async () => {
      const result = await gradingService.grade(sampleRequest);

      // Check each rubric item has corresponding grade item
      for (const rubricItem of sampleRubric) {
        const gradeItem = result.items.find((item) => item.id === rubricItem.id);
        expect(gradeItem).toBeDefined();
        expect(gradeItem?.label).toBe(rubricItem.label);
        expect(gradeItem?.maxPoints).toBe(rubricItem.maxPoints);
        expect(gradeItem?.points).toBeGreaterThanOrEqual(0);
        expect(gradeItem?.points).toBeLessThanOrEqual(rubricItem.maxPoints);
        expect(gradeItem?.comments).toBeTruthy();
      }
    });

    it("should calculate correct total awarded points", async () => {
      const result = await gradingService.grade(sampleRequest);

      const calculatedTotal = result.items.reduce(
        (sum, item) => sum + item.points,
        0
      );

      expect(result.totalAwarded).toBe(calculatedTotal);
    });

    it("should handle retries on provider failure", async () => {
      // Create a provider that fails twice then succeeds
      let attemptCount = 0;
      const flakeyProvider: IGradingProvider = {
        getName: () => "FlakeyProvider",
        isAvailable: async () => true,
        grade: async (request: GradeRequest) => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error("Temporary failure");
          }
          return mockProvider.grade(request);
        },
      };

      const service = new GradingService({
        provider: flakeyProvider,
        maxRetries: 3,
        retryDelay: 10,
      });

      const result = await service.grade(sampleRequest);

      expect(attemptCount).toBe(3);
      expect(result).toBeDefined();
      expect(result.totalAwarded).toBeGreaterThan(0);
    });

    it("should fail after max retries exhausted", async () => {
      const failingProvider: IGradingProvider = {
        getName: () => "FailingProvider",
        isAvailable: async () => true,
        grade: async () => {
          throw new Error("Persistent failure");
        },
      };

      const service = new GradingService({
        provider: failingProvider,
        maxRetries: 3,
        retryDelay: 10,
      });

      await expect(service.grade(sampleRequest)).rejects.toThrow(
        /Grading failed after 3 attempts/
      );
    });

    it("should fail if provider is not available", async () => {
      const unavailableProvider: IGradingProvider = {
        getName: () => "UnavailableProvider",
        isAvailable: async () => false,
        grade: async () => {
          throw new Error("Should not be called");
        },
      };

      const service = new GradingService({
        provider: unavailableProvider,
        maxRetries: 1,
        retryDelay: 10,
      });

      await expect(service.grade(sampleRequest)).rejects.toThrow(
        /is not available/
      );
    });

    it("should validate result has all rubric items", async () => {
      // Create a provider that returns incomplete results
      const badProvider: IGradingProvider = {
        getName: () => "BadProvider",
        isAvailable: async () => true,
        grade: async (request: GradeRequest) => {
          // Return result missing one item
          return {
            totalAwarded: 20,
            totalPossible: 30,
            items: [
              {
                id: request.rubric[0].id,
                label: request.rubric[0].label,
                maxPoints: request.rubric[0].maxPoints,
                points: 8,
                comments: "Good work",
              },
            ],
            overallFeedback: "Missing items",
          };
        },
      };

      const service = new GradingService({
        provider: badProvider,
        maxRetries: 1,
        retryDelay: 10,
      });

      await expect(service.grade(sampleRequest)).rejects.toThrow(
        /Result has 1 items but rubric has 3 items/
      );
    });

    it("should validate points are within bounds", async () => {
      // Create a provider that returns out-of-bounds points
      const badProvider: IGradingProvider = {
        getName: () => "BadProvider",
        isAvailable: async () => true,
        grade: async (request: GradeRequest) => {
          return {
            totalAwarded: 100,
            totalPossible: 30,
            items: request.rubric.map((item) => ({
              id: item.id,
              label: item.label,
              maxPoints: item.maxPoints,
              points: item.maxPoints + 10, // Over the limit!
              comments: "Too many points",
            })),
            overallFeedback: "Invalid scores",
          };
        },
      };

      const service = new GradingService({
        provider: badProvider,
        maxRetries: 1,
        retryDelay: 10,
      });

      await expect(service.grade(sampleRequest)).rejects.toThrow(
        /must be between 0 and/
      );
    });

    it("should validate total awarded matches sum of items", async () => {
      // Create a provider that returns mismatched totals
      const badProvider: IGradingProvider = {
        getName: () => "BadProvider",
        isAvailable: async () => true,
        grade: async (request: GradeRequest) => {
          const items = request.rubric.map((item) => ({
            id: item.id,
            label: item.label,
            maxPoints: item.maxPoints,
            points: Math.round(item.maxPoints * 0.8),
            comments: "Good",
          }));

          return {
            totalAwarded: 100, // Wrong total!
            totalPossible: 30,
            items,
            overallFeedback: "Mismatched total",
          };
        },
      };

      const service = new GradingService({
        provider: badProvider,
        maxRetries: 1,
        retryDelay: 10,
      });

      await expect(service.grade(sampleRequest)).rejects.toThrow(
        /doesn't match sum of items/
      );
    });

    it("should require overall feedback", async () => {
      // Create a provider that returns empty feedback
      const badProvider: IGradingProvider = {
        getName: () => "BadProvider",
        isAvailable: async () => true,
        grade: async (request: GradeRequest) => {
          const items = request.rubric.map((item) => ({
            id: item.id,
            label: item.label,
            maxPoints: item.maxPoints,
            points: Math.round(item.maxPoints * 0.8),
            comments: "Good",
          }));

          const totalAwarded = items.reduce((sum, item) => sum + item.points, 0);

          return {
            totalAwarded,
            totalPossible: 30,
            items,
            overallFeedback: "", // Empty!
          };
        },
      };

      const service = new GradingService({
        provider: badProvider,
        maxRetries: 1,
        retryDelay: 10,
      });

      await expect(service.grade(sampleRequest)).rejects.toThrow(
        /Overall feedback is required/
      );
    });
  });

  describe("gradeBatch()", () => {
    it("should grade multiple submissions successfully", async () => {
      const requests: GradeRequest[] = [
        sampleRequest,
        {
          fileUrl: "https://example.com/sample2.pdf",
          rubric: sampleRubric,
        },
        {
          fileUrl: "https://example.com/sample3.pdf",
          rubric: sampleRubric,
        },
      ];

      const results = await gradingService.gradeBatch(requests);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
      expect(results.every((r) => r.result !== undefined)).toBe(true);
    });

    it("should handle mixed success and failure in batch", async () => {
      // Create provider that fails for specific URLs
      const selectiveProvider: IGradingProvider = {
        getName: () => "SelectiveProvider",
        isAvailable: async () => true,
        grade: async (request: GradeRequest) => {
          if (request.fileUrl.includes("fail")) {
            throw new Error("Intentional failure");
          }
          return mockProvider.grade(request);
        },
      };

      const service = new GradingService({
        provider: selectiveProvider,
        maxRetries: 1,
        retryDelay: 10,
      });

      const requests: GradeRequest[] = [
        { fileUrl: "https://example.com/success1.pdf", rubric: sampleRubric },
        { fileUrl: "https://example.com/fail.pdf", rubric: sampleRubric },
        { fileUrl: "https://example.com/success2.pdf", rubric: sampleRubric },
      ];

      const results = await service.gradeBatch(requests);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toContain("Intentional failure");
      expect(results[2].success).toBe(true);
    });
  });

  describe("getProviderName()", () => {
    it("should return the provider name", () => {
      expect(gradingService.getProviderName()).toBe("MockGradingProvider");
    });
  });

  describe("isReady()", () => {
    it("should return true when provider is available", async () => {
      const isReady = await gradingService.isReady();
      expect(isReady).toBe(true);
    });

    it("should return false when provider is not available", async () => {
      const unavailableProvider: IGradingProvider = {
        getName: () => "UnavailableProvider",
        isAvailable: async () => false,
        grade: async () => {
          throw new Error("Not available");
        },
      };

      const service = new GradingService({
        provider: unavailableProvider,
      });

      const isReady = await service.isReady();
      expect(isReady).toBe(false);
    });
  });
});

