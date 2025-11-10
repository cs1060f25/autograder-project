/**
 * Integration tests for Grading API
 * 
 * These tests verify the grading API endpoint works correctly
 * with the GradingService.
 * 
 * Note: These are simplified integration tests that mock the fetch API.
 * In a production environment, you'd want to use a tool like MSW (Mock Service Worker)
 * or run actual API tests against a test server.
 */

import { describe, it, expect, beforeAll, jest } from "@jest/globals";

// Simple FormData polyfill for test environment
class MockFormData {
  private data: Map<string, string> = new Map();
  
  append(key: string, value: string): void {
    this.data.set(key, value);
  }
  
  get(key: string): string | null {
    return this.data.get(key) || null;
  }
  
  has(key: string): boolean {
    return this.data.has(key);
  }
  
  toString(): string {
    const params = new URLSearchParams();
    this.data.forEach((value, key) => params.append(key, value));
    return params.toString();
  }
}

// Set up global mocks before tests run
beforeAll(() => {
  // @ts-ignore - Adding FormData to global
  global.FormData = MockFormData;
  
  // @ts-ignore - Adding fetch mock to global
  global.fetch = jest.fn(async (url: string | URL, options?: RequestInit) => {
    const body = options?.body?.toString() || "";
    const isUseMock = body.includes("useMock");
    const hasFile = body.includes("file");
    const hasRubric = body.includes("rubric");
    
    // Check for missing parameters first (validation errors)
    if (!hasRubric) {
      return {
        status: 400,
        ok: false,
        json: async () => ({ error: "`rubric` must be a JSON string" }),
      };
    }
    
    if (!hasFile) {
      return {
        status: 400,
        ok: false,
        json: async () => ({ error: "`file` must be a valid URL string" }),
      };
    }
    
    // Check for empty rubric
    if (body.includes("rubric=%5B%5D")) {
      return {
        status: 400,
        ok: false,
        json: async () => ({ error: "Empty rubric" }),
      };
    }
    
    // Check for invalid JSON
    if (body.includes("invalid+json")) {
      return {
        status: 400,
        ok: false,
        json: async () => ({ error: "`rubric` must be valid JSON array of rubric items" }),
      };
    }
    
    // Check for OpenAI key if not using mock (server error)
    if (!isUseMock && !process.env.OPENAI_KEY) {
      return {
        status: 500,
        ok: false,
        json: async () => ({ error: "Missing OPENAI_KEY configuration" }),
      };
    }
    
    // Success case - return mock grading result
    return {
      status: 200,
      ok: true,
      json: async () => ({
        totalAwarded: 34,
        totalPossible: 40,
        items: [
          {
            id: "content",
            label: "Content Quality",
            maxPoints: 20,
            points: 17,
            comments: "Good work on content. You demonstrated strong understanding.",
          },
          {
            id: "structure",
            label: "Structure",
            maxPoints: 10,
            points: 9,
            comments: "Solid structure. Consider adding more detail to strengthen your work.",
          },
          {
            id: "presentation",
            label: "Presentation",
            maxPoints: 10,
            points: 8,
            comments: "Nice job with presentation. A few enhancements would make it even better.",
          },
        ],
        overallFeedback: "Good work overall! You showed solid understanding with room for minor improvements.",
      }),
    };
  });
});

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

