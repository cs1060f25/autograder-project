/**
 * Unit tests for MockGradingProvider
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { MockGradingProvider, GradeRequest } from "@/services/grading";

describe("MockGradingProvider", () => {
  let provider: MockGradingProvider;

  const sampleRequest: GradeRequest = {
    fileUrl: "https://example.com/test.pdf",
    rubric: [
      {
        id: "criterion1",
        label: "Code Quality",
        maxPoints: 20,
        guidance: "Is the code well-written?",
      },
      {
        id: "criterion2",
        label: "Documentation",
        maxPoints: 10,
        guidance: "Is there adequate documentation?",
      },
      {
        id: "criterion3",
        label: "Testing",
        maxPoints: 15,
        guidance: "Are tests comprehensive?",
      },
    ],
  };

  beforeEach(() => {
    provider = new MockGradingProvider({
      scorePercentage: 0.85,
      simulatedDelay: 0,
      addVariation: false,
    });
  });

  describe("grade()", () => {
    it("should return a valid grade result", async () => {
      const result = await provider.grade(sampleRequest);

      expect(result).toBeDefined();
      expect(result.totalPossible).toBe(45); // 20 + 10 + 15
      expect(result.totalAwarded).toBeGreaterThan(0);
      expect(result.totalAwarded).toBeLessThanOrEqual(45);
      expect(result.items).toHaveLength(3);
      expect(result.overallFeedback).toBeTruthy();
    });

    it("should award approximately the configured percentage", async () => {
      const percentage = 0.8;
      provider = new MockGradingProvider({
        scorePercentage: percentage,
        simulatedDelay: 0,
        addVariation: false,
      });

      const result = await provider.grade(sampleRequest);
      const totalPossible = 45;
      const expectedScore = Math.round(totalPossible * percentage);

      // With no variation, score should be close to expected
      expect(Math.abs(result.totalAwarded - expectedScore)).toBeLessThan(5);
    });

    it("should add variation when configured", async () => {
      provider = new MockGradingProvider({
        scorePercentage: 0.85,
        simulatedDelay: 0,
        addVariation: true,
      });

      // Run multiple times and check for variation
      const results = await Promise.all(
        Array(10)
          .fill(null)
          .map(() => provider.grade(sampleRequest))
      );

      const scores = results.map((r) => r.totalAwarded);
      const uniqueScores = new Set(scores);

      // With variation, we should have some diversity in scores
      expect(uniqueScores.size).toBeGreaterThan(1);
    });

    it("should generate contextual feedback for each criterion", async () => {
      const result = await provider.grade(sampleRequest);

      for (const item of result.items) {
        expect(item.comments).toBeTruthy();
        expect(item.comments.length).toBeGreaterThan(10);
        // Feedback should reference the criterion
        expect(
          item.comments.toLowerCase().includes(item.label.toLowerCase().split(" ")[0])
        ).toBe(true);
      }
    });

    it("should generate overall feedback based on performance", async () => {
      // Test high performance
      provider = new MockGradingProvider({
        scorePercentage: 0.95,
        simulatedDelay: 0,
        addVariation: false,
      });

      const highResult = await provider.grade(sampleRequest);
      expect(highResult.overallFeedback.toLowerCase()).toContain("excellent");

      // Test medium performance
      provider = new MockGradingProvider({
        scorePercentage: 0.75,
        simulatedDelay: 0,
        addVariation: false,
      });

      const mediumResult = await provider.grade(sampleRequest);
      expect(
        mediumResult.overallFeedback.toLowerCase().includes("satisfactory") ||
        mediumResult.overallFeedback.toLowerCase().includes("good")
      ).toBe(true);

      // Test low performance
      provider = new MockGradingProvider({
        scorePercentage: 0.5,
        simulatedDelay: 0,
        addVariation: false,
      });

      const lowResult = await provider.grade(sampleRequest);
      expect(
        lowResult.overallFeedback.toLowerCase().includes("needs") ||
        lowResult.overallFeedback.toLowerCase().includes("improve")
      ).toBe(true);
    });

    it("should simulate API delay", async () => {
      const delay = 100;
      provider = new MockGradingProvider({
        scorePercentage: 0.85,
        simulatedDelay: delay,
      });

      const startTime = Date.now();
      await provider.grade(sampleRequest);
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeGreaterThanOrEqual(delay - 10); // Allow small margin
    });

    it("should simulate failures when configured", async () => {
      provider = new MockGradingProvider({
        scorePercentage: 0.85,
        simulatedDelay: 0,
        simulateFailure: true,
        failureRate: 1.0, // Always fail
      });

      await expect(provider.grade(sampleRequest)).rejects.toThrow(
        /Simulated failure/
      );
    });

    it("should fail without file URL", async () => {
      const invalidRequest = {
        ...sampleRequest,
        fileUrl: "",
      };

      await expect(provider.grade(invalidRequest)).rejects.toThrow(
        /File URL is required/
      );
    });

    it("should fail with empty rubric", async () => {
      const invalidRequest = {
        ...sampleRequest,
        rubric: [],
      };

      await expect(provider.grade(invalidRequest)).rejects.toThrow(
        /Rubric is required/
      );
    });

    it("should never exceed max points for any criterion", async () => {
      provider = new MockGradingProvider({
        scorePercentage: 0.95,
        simulatedDelay: 0,
        addVariation: true,
      });

      // Run multiple times to check bounds
      const results = await Promise.all(
        Array(20)
          .fill(null)
          .map(() => provider.grade(sampleRequest))
      );

      for (const result of results) {
        for (const item of result.items) {
          expect(item.points).toBeGreaterThanOrEqual(0);
          expect(item.points).toBeLessThanOrEqual(item.maxPoints);
        }
      }
    });
  });

  describe("getName()", () => {
    it("should return MockGradingProvider", () => {
      expect(provider.getName()).toBe("MockGradingProvider");
    });
  });

  describe("isAvailable()", () => {
    it("should always return true", async () => {
      const isAvailable = await provider.isAvailable();
      expect(isAvailable).toBe(true);
    });
  });

  describe("updateConfig()", () => {
    it("should update configuration at runtime", async () => {
      provider = new MockGradingProvider({
        scorePercentage: 0.5,
        simulatedDelay: 0,
        addVariation: false,
      });

      // First grade with 50% score
      const result1 = await provider.grade(sampleRequest);
      const score1 = result1.totalAwarded;

      // Update to 90% score
      provider.updateConfig({ scorePercentage: 0.9 });

      // Grade again
      const result2 = await provider.grade(sampleRequest);
      const score2 = result2.totalAwarded;

      // Second score should be higher
      expect(score2).toBeGreaterThan(score1);
    });
  });
});

