/**
 * Integration tests for Grading API
 * 
 * These tests verify the grading API endpoint works correctly
 * with the GradingService.
 */

import { describe, it, expect, beforeAll } from "@jest/globals";

describe("Grading API Integration", () => {
  const API_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const GRADING_ENDPOINT = `${API_URL}/api/grade`;

  const sampleRubric = [
    {
      id: "content",
      label: "Content Quality",
      maxPoints: 20,
      guidance: "Is the content thorough and accurate?",
    },
    {
      id: "structure",
      label: "Structure",
      maxPoints: 10,
      guidance: "Is the work well-organized?",
    },
    {
      id: "presentation",
      label: "Presentation",
      maxPoints: 10,
      guidance: "Is the work professionally presented?",
    },
  ];

  describe("POST /api/grade", () => {
    it("should grade a submission with mock provider", async () => {
      const formData = new FormData();
      formData.append("file", "https://example.com/sample.pdf");
      formData.append("rubric", JSON.stringify(sampleRubric));
      formData.append("useMock", "true"); // Use mock provider

      const response = await fetch(GRADING_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);

      const result = await response.json();

      expect(result).toHaveProperty("totalAwarded");
      expect(result).toHaveProperty("totalPossible");
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("overallFeedback");

      expect(result.totalPossible).toBe(40); // Sum of maxPoints
      expect(result.items).toHaveLength(3);
      expect(result.totalAwarded).toBeGreaterThan(0);
      expect(result.totalAwarded).toBeLessThanOrEqual(40);
    });

    it("should return error for missing rubric", async () => {
      const formData = new FormData();
      formData.append("file", "https://example.com/sample.pdf");
      // Missing rubric

      const response = await fetch(GRADING_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty("error");
      expect(result.error).toContain("rubric");
    });

    it("should return error for missing file URL", async () => {
      const formData = new FormData();
      // Missing file
      formData.append("rubric", JSON.stringify(sampleRubric));
      formData.append("useMock", "true");

      const response = await fetch(GRADING_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty("error");
      expect(result.error).toContain("file");
    });

    it("should return error for invalid rubric format", async () => {
      const formData = new FormData();
      formData.append("file", "https://example.com/sample.pdf");
      formData.append("rubric", "invalid json");
      formData.append("useMock", "true");

      const response = await fetch(GRADING_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty("error");
      expect(result.error).toContain("rubric");
    });

    it("should return error for empty rubric array", async () => {
      const formData = new FormData();
      formData.append("file", "https://example.com/sample.pdf");
      formData.append("rubric", JSON.stringify([]));
      formData.append("useMock", "true");

      const response = await fetch(GRADING_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty("error");
      expect(result.error).toContain("Empty rubric");
    });

    it("should include all rubric items in response", async () => {
      const formData = new FormData();
      formData.append("file", "https://example.com/sample.pdf");
      formData.append("rubric", JSON.stringify(sampleRubric));
      formData.append("useMock", "true");

      const response = await fetch(GRADING_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);

      const result = await response.json();

      // Check each rubric item has corresponding result
      for (const rubricItem of sampleRubric) {
        const resultItem = result.items.find(
          (item: any) => item.id === rubricItem.id
        );
        expect(resultItem).toBeDefined();
        expect(resultItem.label).toBe(rubricItem.label);
        expect(resultItem.maxPoints).toBe(rubricItem.maxPoints);
        expect(resultItem.points).toBeGreaterThanOrEqual(0);
        expect(resultItem.points).toBeLessThanOrEqual(rubricItem.maxPoints);
        expect(resultItem.comments).toBeTruthy();
      }
    });

    it("should return 503 if OpenAI provider is not configured and useMock is false", async () => {
      // This test assumes OPENAI_KEY is not set in test environment
      const originalKey = process.env.OPENAI_KEY;
      delete process.env.OPENAI_KEY;

      const formData = new FormData();
      formData.append("file", "https://example.com/sample.pdf");
      formData.append("rubric", JSON.stringify(sampleRubric));
      // Don't use mock, try to use OpenAI

      const response = await fetch(GRADING_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      // Restore env var
      if (originalKey) {
        process.env.OPENAI_KEY = originalKey;
      }

      expect(response.status).toBe(500);

      const result = await response.json();
      expect(result).toHaveProperty("error");
      expect(result.error).toContain("OPENAI_KEY");
    });
  });
});

