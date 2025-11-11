/**
 * Unit tests for AutograderService
 * 
 * Tests the orchestration of document management, grading, and storage
 */

import { AutograderService } from "@/services/autograder";
import type {
  AutogradeRequest,
  AutogradeResult,
  BatchAutogradeRequest,
} from "@/services/autograder";

// Mock Supabase client
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

// Mock grading service
jest.mock("@/services/grading", () => ({
  GradingService: jest.fn().mockImplementation(() => ({
    grade: jest.fn(),
    isReady: jest.fn().mockResolvedValue(true),
  })),
}));

// Mock grading providers
jest.mock("@/services/grading/providers/OpenAIGradingProvider", () => ({
  OpenAIGradingProvider: jest.fn(),
}));

jest.mock("@/services/grading/providers/MockGradingProvider", () => ({
  MockGradingProvider: jest.fn(),
}));

import { createClient } from "@/utils/supabase/server";
import { GradingService } from "@/services/grading";

describe("AutograderService", () => {
  let mockSupabaseClient: any;
  let mockGradingService: any;
  let service: AutograderService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);

    // Setup mock grading service
    mockGradingService = {
      grade: jest.fn(),
      isReady: jest.fn().mockResolvedValue(true),
    };

    (GradingService as jest.Mock).mockImplementation(() => mockGradingService);

    // Create service instance with mock grading
    service = new AutograderService({ useMockGrading: true });
  });

  describe("autograde", () => {
    it("should successfully autograde a submission with valid inputs", async () => {
      // Setup mock data
      const request: AutogradeRequest = {
        submissionId: "sub-123",
        assignmentId: "assign-456",
        documents: [
          {
            id: "doc-1",
            url: "https://example.com/submission.pdf",
            name: "submission.pdf",
            type: "application/pdf",
            size: 1024 * 1024, // 1MB
          },
        ],
      };

      // Mock rubric fetch
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: "rubric-789",
          criteria: [
            {
              id: "clarity",
              name: "Clarity",
              max_points: 10,
              description: "Is the writing clear?",
            },
            {
              id: "accuracy",
              name: "Accuracy",
              max_points: 15,
              description: "Are the facts correct?",
            },
          ],
        },
        error: null,
      });

      // Mock grading result
      mockGradingService.grade.mockResolvedValueOnce({
        totalAwarded: 22,
        totalPossible: 25,
        items: [
          {
            id: "clarity",
            label: "Clarity",
            maxPoints: 10,
            points: 9,
            comments: "Very clear writing",
          },
          {
            id: "accuracy",
            label: "Accuracy",
            maxPoints: 15,
            points: 13,
            comments: "Mostly accurate with minor issues",
          },
        ],
        overallFeedback: "Good work overall",
      });

      // Mock submission status updates
      mockSupabaseClient.update.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();

      // Mock rubric scores check (no existing scores)
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: {
            id: "rubric-789",
            criteria: [
              {
                id: "clarity",
                name: "Clarity",
                max_points: 10,
                description: "Is the writing clear?",
              },
              {
                id: "accuracy",
                name: "Accuracy",
                max_points: 15,
                description: "Are the facts correct?",
              },
            ],
          },
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabaseClient.insert.mockResolvedValueOnce({ error: null });

      // Execute
      const result = await service.autograde(request);

      // Assert
      expect(result.status).toBe("completed");
      expect(result.submissionId).toBe("sub-123");
      expect(result.totalAwarded).toBe(22);
      expect(result.totalPossible).toBe(25);
      expect(result.items).toHaveLength(2);
      expect(result.overallFeedback).toBe("Good work overall");
      expect(result.error).toBeUndefined();

      // Verify grading service was called with correct parameters
      expect(mockGradingService.grade).toHaveBeenCalledWith({
        fileUrl: "https://example.com/submission.pdf",
        rubric: [
          {
            id: "clarity",
            label: "Clarity",
            maxPoints: 10,
            guidance: "Is the writing clear?",
          },
          {
            id: "accuracy",
            label: "Accuracy",
            maxPoints: 15,
            guidance: "Are the facts correct?",
          },
        ],
      });
    });

    it("should return no_rubric status when rubric is not found", async () => {
      const request: AutogradeRequest = {
        submissionId: "sub-123",
        assignmentId: "assign-456",
        documents: [
          {
            id: "doc-1",
            url: "https://example.com/submission.pdf",
            name: "submission.pdf",
            type: "application/pdf",
            size: 1024 * 1024,
          },
        ],
      };

      // Mock rubric not found
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      const result = await service.autograde(request);

      expect(result.status).toBe("no_rubric");
      expect(result.error).toBe("No rubric found for this assignment");
      expect(mockGradingService.grade).not.toHaveBeenCalled();
    });

    it("should return no_documents status when no PDF documents are provided", async () => {
      const request: AutogradeRequest = {
        submissionId: "sub-123",
        assignmentId: "assign-456",
        documents: [
          {
            id: "doc-1",
            url: "https://example.com/submission.txt",
            name: "submission.txt",
            type: "text/plain",
            size: 1024,
          },
        ],
      };

      // Mock rubric fetch
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: "rubric-789",
          criteria: [
            {
              id: "clarity",
              name: "Clarity",
              max_points: 10,
              description: "Is the writing clear?",
            },
          ],
        },
        error: null,
      });

      const result = await service.autograde(request);

      expect(result.status).toBe("no_documents");
      expect(result.error).toBe("No valid PDF documents found");
      expect(mockGradingService.grade).not.toHaveBeenCalled();
    });

    it("should return failed status when grading service throws error", async () => {
      const request: AutogradeRequest = {
        submissionId: "sub-123",
        assignmentId: "assign-456",
        documents: [
          {
            id: "doc-1",
            url: "https://example.com/submission.pdf",
            name: "submission.pdf",
            type: "application/pdf",
            size: 1024 * 1024,
          },
        ],
      };

      // Mock rubric fetch
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: "rubric-789",
          criteria: [
            {
              id: "clarity",
              name: "Clarity",
              max_points: 10,
              description: "Is the writing clear?",
            },
          ],
        },
        error: null,
      });

      // Mock grading service error
      mockGradingService.grade.mockRejectedValueOnce(
        new Error("Grading API failed")
      );

      const result = await service.autograde(request);

      expect(result.status).toBe("failed");
      expect(result.error).toBe("Grading API failed");
    });

    it("should filter out invalid documents", async () => {
      const request: AutogradeRequest = {
        submissionId: "sub-123",
        assignmentId: "assign-456",
        documents: [
          // Invalid: not a PDF
          {
            id: "doc-1",
            url: "https://example.com/submission.txt",
            name: "submission.txt",
            type: "text/plain",
            size: 1024,
          },
          // Invalid: too large (> 50MB)
          {
            id: "doc-2",
            url: "https://example.com/large.pdf",
            name: "large.pdf",
            type: "application/pdf",
            size: 60 * 1024 * 1024,
          },
          // Invalid: bad URL
          {
            id: "doc-3",
            url: "not-a-url",
            name: "bad.pdf",
            type: "application/pdf",
            size: 1024 * 1024,
          },
          // Valid
          {
            id: "doc-4",
            url: "https://example.com/valid.pdf",
            name: "valid.pdf",
            type: "application/pdf",
            size: 1024 * 1024,
          },
        ],
      };

      // Mock rubric fetch
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: "rubric-789",
          criteria: [
            {
              id: "clarity",
              name: "Clarity",
              max_points: 10,
              description: "Is the writing clear?",
            },
          ],
        },
        error: null,
      });

      // Mock grading result
      mockGradingService.grade.mockResolvedValueOnce({
        totalAwarded: 8,
        totalPossible: 10,
        items: [
          {
            id: "clarity",
            label: "Clarity",
            maxPoints: 10,
            points: 8,
            comments: "Clear",
          },
        ],
        overallFeedback: "Good",
      });

      // Mock other DB calls
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: {
            id: "rubric-789",
            criteria: [
              {
                id: "clarity",
                name: "Clarity",
                max_points: 10,
                description: "Is the writing clear?",
              },
            ],
          },
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabaseClient.insert.mockResolvedValueOnce({ error: null });

      const result = await service.autograde(request);

      // Should process the valid document only
      expect(result.status).toBe("completed");
      expect(mockGradingService.grade).toHaveBeenCalledWith(
        expect.objectContaining({
          fileUrl: "https://example.com/valid.pdf",
        })
      );
    });
  });

  describe("autogradeBatch", () => {
    it("should process multiple submissions in parallel", async () => {
      const batchRequest: BatchAutogradeRequest = {
        requests: [
          {
            submissionId: "sub-1",
            assignmentId: "assign-1",
            documents: [
              {
                id: "doc-1",
                url: "https://example.com/sub1.pdf",
                name: "sub1.pdf",
                type: "application/pdf",
                size: 1024 * 1024,
              },
            ],
          },
          {
            submissionId: "sub-2",
            assignmentId: "assign-1",
            documents: [
              {
                id: "doc-2",
                url: "https://example.com/sub2.pdf",
                name: "sub2.pdf",
                type: "application/pdf",
                size: 1024 * 1024,
              },
            ],
          },
        ],
        parallel: true,
      };

      // Mock rubric fetch for both
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: "rubric-789",
          criteria: [
            {
              id: "clarity",
              name: "Clarity",
              max_points: 10,
              description: "Is the writing clear?",
            },
          ],
        },
        error: null,
      });

      // Mock grading results
      mockGradingService.grade.mockResolvedValue({
        totalAwarded: 8,
        totalPossible: 10,
        items: [
          {
            id: "clarity",
            label: "Clarity",
            maxPoints: 10,
            points: 8,
            comments: "Good",
          },
        ],
        overallFeedback: "Good work",
      });

      mockSupabaseClient.insert.mockResolvedValue({ error: null });

      const result = await service.autogradeBatch(batchRequest);

      expect(result.results).toHaveLength(2);
      expect(result.summary.total).toBe(2);
      expect(result.summary.completed).toBe(2);
      expect(result.summary.failed).toBe(0);
      expect(mockGradingService.grade).toHaveBeenCalledTimes(2);
    });

    it("should calculate correct summary statistics", async () => {
      const batchRequest: BatchAutogradeRequest = {
        requests: [
          {
            submissionId: "sub-1",
            assignmentId: "assign-1",
            documents: [
              {
                id: "doc-1",
                url: "https://example.com/sub1.pdf",
                name: "sub1.pdf",
                type: "application/pdf",
                size: 1024 * 1024,
              },
            ],
          },
          {
            submissionId: "sub-2",
            assignmentId: "assign-2", // No rubric
            documents: [
              {
                id: "doc-2",
                url: "https://example.com/sub2.pdf",
                name: "sub2.pdf",
                type: "application/pdf",
                size: 1024 * 1024,
              },
            ],
          },
          {
            submissionId: "sub-3",
            assignmentId: "assign-1",
            documents: [], // No documents
          },
        ],
        parallel: true,
      };

      // Mock responses
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          // First submission - success
          data: {
            id: "rubric-1",
            criteria: [{ id: "c1", name: "C1", max_points: 10 }],
          },
          error: null,
        })
        .mockResolvedValueOnce({
          // First submission - no existing scores
          data: null,
          error: null,
        })
        .mockResolvedValueOnce({
          // Second submission - no rubric
          data: null,
          error: { message: "Not found" },
        })
        .mockResolvedValueOnce({
          // Third submission - has rubric
          data: {
            id: "rubric-1",
            criteria: [{ id: "c1", name: "C1", max_points: 10 }],
          },
          error: null,
        });

      mockGradingService.grade.mockResolvedValue({
        totalAwarded: 8,
        totalPossible: 10,
        items: [
          { id: "c1", label: "C1", maxPoints: 10, points: 8, comments: "Good" },
        ],
        overallFeedback: "Good",
      });

      mockSupabaseClient.insert.mockResolvedValue({ error: null });

      const result = await service.autogradeBatch(batchRequest);

      expect(result.summary.total).toBe(3);
      expect(result.summary.completed).toBe(1);
      expect(result.summary.noRubric).toBe(1);
      expect(result.summary.noDocuments).toBe(1);
      expect(result.summary.failed).toBe(0);
    });
  });

  describe("getStatus", () => {
    it("should return status and result for completed submission", async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          ai_grade_status: "completed",
          ai_grade_data: {
            totalAwarded: 20,
            totalPossible: 25,
            items: [
              {
                id: "clarity",
                label: "Clarity",
                maxPoints: 10,
                points: 8,
                comments: "Good",
              },
            ],
            overallFeedback: "Good work",
          },
          ai_graded_at: "2025-01-01T00:00:00Z",
        },
        error: null,
      });

      const status = await service.getStatus("sub-123");

      expect(status.status).toBe("completed");
      expect(status.result).toBeDefined();
      expect(status.result?.totalAwarded).toBe(20);
      expect(status.result?.totalPossible).toBe(25);
    });

    it("should return pending status for ungraded submission", async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          ai_grade_status: null,
          ai_grade_data: null,
          ai_graded_at: null,
        },
        error: null,
      });

      const status = await service.getStatus("sub-123");

      expect(status.status).toBe("pending");
      expect(status.result).toBeUndefined();
    });

    it("should return failed status when submission not found", async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      const status = await service.getStatus("sub-123");

      expect(status.status).toBe("failed");
      expect(status.result).toBeUndefined();
    });
  });

  describe("isReady", () => {
    it("should return true when grading service is ready", async () => {
      mockGradingService.isReady.mockResolvedValueOnce(true);

      const ready = await service.isReady();

      expect(ready).toBe(true);
    });

    it("should return false when grading service is not ready", async () => {
      mockGradingService.isReady.mockResolvedValueOnce(false);

      const ready = await service.isReady();

      expect(ready).toBe(false);
    });
  });
});

