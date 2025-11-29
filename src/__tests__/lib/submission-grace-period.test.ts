/**
 * @jest-environment node
 */

import {
  createSubmission,
  uploadSubmissionDocument,
} from "@/lib/submission-actions";

// Mock the dependencies
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/user-utils", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/lib/rubric-actions", () => ({
  saveRubricScores: jest.fn(),
  getRubricByAssignment: jest.fn(),
}));

jest.mock("@/lib/ai-grading-actions", () => ({
  triggerAIGrading: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("@/lib/notification-actions", () => ({
  notifyDocumentUploaded: jest.fn().mockResolvedValue({ success: true }),
}));

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/user-utils";

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

describe("24-Hour Grace Period for Submissions", () => {
  let mockSupabaseClient: any;
  let mockStorage: any;
  const studentId = "student-123";
  const assignmentId = "assignment-456";
  const courseId = "course-789";

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock storage
    mockStorage = {
      from: jest.fn().mockReturnThis(),
      upload: jest.fn(),
      createSignedUrl: jest.fn(),
      remove: jest.fn(),
    };

    // Mock Supabase client
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      storage: mockStorage,
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient);

    // Mock authenticated student
    mockRequireAuth.mockResolvedValue({
      id: studentId,
      email: "student@test.com",
      role: "student",
      first_name: "Test",
      last_name: "Student",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  describe("createSubmission with grace period", () => {
    it("should allow submission within 24-hour grace period (1 hour past due)", async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      
      // Mock assignment check
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: {
            id: assignmentId,
            status: "published",
            due_date: oneHourAgo.toISOString(),
            course_id: courseId,
          },
          error: null,
        })
        // Mock enrollment check
        .mockResolvedValueOnce({
          data: { id: "enrollment-1" },
          error: null,
        })
        // Mock existing submission check
        .mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116" },
        })
        // Mock get submission ID after insert
        .mockResolvedValueOnce({
          data: { id: "submission-1" },
          error: null,
        });

      mockSupabaseClient.insert.mockResolvedValue({
        error: null,
      });

      const result = await createSubmission(
        assignmentId,
        "Test submission content",
        []
      );

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it("should allow submission within 24-hour grace period (23 hours past due)", async () => {
      const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000);
      
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: {
            id: assignmentId,
            status: "published",
            due_date: twentyThreeHoursAgo.toISOString(),
            course_id: courseId,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "enrollment-1" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116" },
        })
        .mockResolvedValueOnce({
          data: { id: "submission-1" },
          error: null,
        });

      mockSupabaseClient.insert.mockResolvedValue({
        error: null,
      });

      const result = await createSubmission(
        assignmentId,
        "Test submission content",
        []
      );

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it("should allow submission exactly at 24-hour mark", async () => {
      const exactlyTwentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: {
            id: assignmentId,
            status: "published",
            due_date: exactlyTwentyFourHoursAgo.toISOString(),
            course_id: courseId,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "enrollment-1" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116" },
        })
        .mockResolvedValueOnce({
          data: { id: "submission-1" },
          error: null,
        });

      mockSupabaseClient.insert.mockResolvedValue({
        error: null,
      });

      const result = await createSubmission(
        assignmentId,
        "Test submission content",
        []
      );

      expect(result.success).toBe(true);
    });

    it("should reject submission after 24-hour grace period (25 hours past due)", async () => {
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
      
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: assignmentId,
          status: "published",
          due_date: twentyFiveHoursAgo.toISOString(),
          course_id: courseId,
        },
        error: null,
      });

      const result = await createSubmission(
        assignmentId,
        "Test submission content",
        []
      );

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/grace period|closed|no longer accepting/i);
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });

    it("should reject submission after 24-hour grace period (48 hours past due)", async () => {
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: assignmentId,
          status: "published",
          due_date: twoDaysAgo.toISOString(),
          course_id: courseId,
        },
        error: null,
      });

      const result = await createSubmission(
        assignmentId,
        "Test submission content",
        []
      );

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/grace period|closed|no longer accepting/i);
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });

    it("should still allow submission before due date", async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: {
            id: assignmentId,
            status: "published",
            due_date: tomorrow.toISOString(),
            course_id: courseId,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "enrollment-1" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116" },
        })
        .mockResolvedValueOnce({
          data: { id: "submission-1" },
          error: null,
        });

      mockSupabaseClient.insert.mockResolvedValue({
        error: null,
      });

      const result = await createSubmission(
        assignmentId,
        "Test submission content",
        []
      );

      expect(result.success).toBe(true);
    });

    it("should mark submission as late when submitted during grace period", async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: {
            id: assignmentId,
            status: "published",
            due_date: twoHoursAgo.toISOString(),
            course_id: courseId,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "enrollment-1" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116" },
        })
        .mockResolvedValueOnce({
          data: { id: "submission-1" },
          error: null,
        });

      mockSupabaseClient.insert.mockResolvedValue({
        error: null,
      });

      const result = await createSubmission(
        assignmentId,
        "Test submission content",
        []
      );

      expect(result.success).toBe(true);
      
      // Verify that the submission is marked as late
      const insertCall = mockSupabaseClient.insert.mock.calls[0][0];
      expect(insertCall.is_late).toBe(true);
      expect(insertCall.status).toBe("submitted");
    });

    it("should not mark submission as late when submitted before due date", async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: {
            id: assignmentId,
            status: "published",
            due_date: tomorrow.toISOString(),
            course_id: courseId,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "enrollment-1" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116" },
        })
        .mockResolvedValueOnce({
          data: { id: "submission-1" },
          error: null,
        });

      mockSupabaseClient.insert.mockResolvedValue({
        error: null,
      });

      const result = await createSubmission(
        assignmentId,
        "Test submission content",
        []
      );

      expect(result.success).toBe(true);
      
      // Verify that the submission is NOT marked as late
      const insertCall = mockSupabaseClient.insert.mock.calls[0][0];
      expect(insertCall.is_late).toBe(false);
    });
  });

  describe("uploadSubmissionDocument with grace period", () => {
    const mockFile = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(mockFile, "size", { value: 5 * 1024 * 1024 }); // 5MB

    it("should allow file upload within 24-hour grace period", async () => {
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
      
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: {
            id: assignmentId,
            status: "published",
            due_date: fiveHoursAgo.toISOString(),
            course_id: courseId,
            max_points: 100,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "enrollment-1", status: "active" },
          error: null,
        });

      mockStorage.upload.mockResolvedValue({
        data: { path: "test-path" },
        error: null,
      });

      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://storage.example.com/signed-url" },
        error: null,
      });

      const result = await uploadSubmissionDocument(mockFile, assignmentId);

      expect(result.success).toBe(true);
      expect(mockStorage.upload).toHaveBeenCalled();
    });

    it("should reject file upload after 24-hour grace period", async () => {
      const twentySixHoursAgo = new Date(Date.now() - 26 * 60 * 60 * 1000);
      
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: assignmentId,
          status: "published",
          due_date: twentySixHoursAgo.toISOString(),
          course_id: courseId,
          max_points: 100,
        },
        error: null,
      });

      const result = await uploadSubmissionDocument(mockFile, assignmentId);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/grace period|closed|cannot upload/i);
      expect(mockStorage.upload).not.toHaveBeenCalled();
    });

    it("should allow file upload before due date", async () => {
      const inOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: {
            id: assignmentId,
            status: "published",
            due_date: inOneDay.toISOString(),
            course_id: courseId,
            max_points: 100,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "enrollment-1", status: "active" },
          error: null,
        });

      mockStorage.upload.mockResolvedValue({
        data: { path: "test-path" },
        error: null,
      });

      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://storage.example.com/signed-url" },
        error: null,
      });

      const result = await uploadSubmissionDocument(mockFile, assignmentId);

      expect(result.success).toBe(true);
    });
  });

  describe("Grace period edge cases", () => {
    it("should handle timezone differences correctly using server time", async () => {
      // Get current server time
      const now = new Date();
      
      // Create a date 12 hours ago (well within grace period)
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: {
            id: assignmentId,
            status: "published",
            due_date: twelveHoursAgo.toISOString(),
            course_id: courseId,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "enrollment-1" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116" },
        })
        .mockResolvedValueOnce({
          data: { id: "submission-1" },
          error: null,
        });

      mockSupabaseClient.insert.mockResolvedValue({
        error: null,
      });

      const result = await createSubmission(
        assignmentId,
        "Test submission content",
        []
      );

      expect(result.success).toBe(true);
    });

    it("should handle update of existing submission within grace period", async () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: {
            id: assignmentId,
            status: "published",
            due_date: threeHoursAgo.toISOString(),
            course_id: courseId,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "enrollment-1" },
          error: null,
        })
        // Mock existing submission
        .mockResolvedValueOnce({
          data: {
            id: "existing-submission-1",
            status: "submitted",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "existing-submission-1" },
          error: null,
        });

      mockSupabaseClient.update.mockResolvedValue({
        error: null,
      });

      const result = await createSubmission(
        assignmentId,
        "Updated submission content",
        []
      );

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.update).toHaveBeenCalled();
      
      // Verify late flag is set on update
      const updateCall = mockSupabaseClient.update.mock.calls[0][0];
      expect(updateCall.is_late).toBe(true);
    });
  });
});

