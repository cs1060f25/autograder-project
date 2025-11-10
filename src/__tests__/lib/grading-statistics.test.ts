/**
 * Tests for grading statistics calculator
 */

import { describe, it, expect } from "@jest/globals";
import { computeStatistics } from "@/lib/grading-statistics";

describe("Grading Statistics", () => {
  describe("computeStatistics()", () => {
    it("should calculate correct average score", () => {
      const submissions = [
        { id: "1", grade: 80, status: "graded" },
        { id: "2", grade: 90, status: "graded" },
        { id: "3", grade: 70, status: "graded" },
      ];

      const result = computeStatistics("assignment-1", submissions);
      
      // Average of 80, 90, 70 should be 80
      expect(result.averageScore).toBe(80);
    });

    it("should calculate correct median score for odd number of submissions", () => {
      const submissions = [
        { id: "1", grade: 70, status: "graded" },
        { id: "2", grade: 80, status: "graded" },
        { id: "3", grade: 90, status: "graded" },
        { id: "4", grade: 60, status: "graded" },
        { id: "5", grade: 85, status: "graded" },
      ];

      const result = computeStatistics("assignment-1", submissions);

      // Sorted: 60, 70, 80, 85, 90 -> median is 80
      expect(result.medianScore).toBe(80);
    });

    it("should calculate correct median score for even number of submissions", () => {
      const submissions = [
        { id: "1", grade: 70, status: "graded" },
        { id: "2", grade: 80, status: "graded" },
        { id: "3", grade: 90, status: "graded" },
        { id: "4", grade: 60, status: "graded" },
      ];

      const result = computeStatistics("assignment-1", submissions);

      // Sorted: 60, 70, 80, 90 -> median is (70 + 80) / 2 = 75
      expect(result.medianScore).toBe(75);
    });

    it("should calculate correct min and max scores", () => {
      const submissions = [
        { id: "1", grade: 75, status: "graded" },
        { id: "2", grade: 95, status: "graded" },
        { id: "3", grade: 55, status: "graded" },
        { id: "4", grade: 85, status: "graded" },
      ];

      const result = computeStatistics("assignment-1", submissions);

      expect(result.minScore).toBe(55);
      expect(result.maxScore).toBe(95);
    });

    it("should calculate score distribution correctly", () => {
      const submissions = [
        { id: "1", grade: 50, status: "graded" },  // 0-59
        { id: "2", grade: 65, status: "graded" },  // 60-69
        { id: "3", grade: 75, status: "graded" },  // 70-79
        { id: "4", grade: 85, status: "graded" },  // 80-89
        { id: "5", grade: 95, status: "graded" },  // 90-100
        { id: "6", grade: 88, status: "graded" },  // 80-89
      ];

      const result = computeStatistics("assignment-1", submissions);

      expect(result.scoreDistribution).toEqual([
        { range: "0-59", count: 1 },
        { range: "60-69", count: 1 },
        { range: "70-79", count: 1 },
        { range: "80-89", count: 2 },
        { range: "90-100", count: 1 },
      ]);
    });

    it("should only count graded submissions", () => {
      const submissions = [
        { id: "1", grade: 80, status: "graded" },
        { id: "2", grade: 90, status: "graded" },
        { id: "3", grade: null, status: "submitted" },
        { id: "4", grade: null, status: "submitted" },
      ];

      const result = computeStatistics("assignment-1", submissions);

      expect(result.totalSubmissions).toBe(4);
      expect(result.gradedSubmissions).toBe(2);
      // Average of 80, 90 should be 85
      expect(result.averageScore).toBe(85);
    });

    it("should handle empty submissions list", () => {
      const submissions: Array<{ id: string; grade: number | null; status: string }> = [];

      const result = computeStatistics("assignment-1", submissions);

      expect(result.totalSubmissions).toBe(0);
      expect(result.gradedSubmissions).toBe(0);
      expect(result.averageScore).toBe(0);
    });

    it("should handle all ungraded submissions", () => {
      const submissions = [
        { id: "1", grade: null, status: "submitted" },
        { id: "2", grade: null, status: "submitted" },
      ];

      const result = computeStatistics("assignment-1", submissions);

      expect(result.totalSubmissions).toBe(2);
      expect(result.gradedSubmissions).toBe(0);
      expect(result.averageScore).toBe(0);
    });

    it("should round average to 2 decimal places", () => {
      const submissions = [
        { id: "1", grade: 85, status: "graded" },
        { id: "2", grade: 87, status: "graded" },
        { id: "3", grade: 91, status: "graded" },
      ];

      const result = computeStatistics("assignment-1", submissions);

      // Average of 85, 87, 91 is 87.666... should round to 87.67
      expect(result.averageScore).toBe(87.67);
    });
  });
});
