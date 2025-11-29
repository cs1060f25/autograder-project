/**
 * @jest-environment node
 */

import {
  createAssignmentAction,
  updateAssignmentAction,
} from "@/lib/assignment-actions";

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
  createRubric: jest.fn(),
  getRubricByAssignment: jest.fn(),
  updateRubric: jest.fn(),
}));

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/user-utils";

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

describe("Past Due Date Validation", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient);

    // Mock authenticated instructor
    mockRequireAuth.mockResolvedValue({
      id: "instructor-123",
      email: "instructor@test.com",
      role: "instructor",
      first_name: "Test",
      last_name: "Instructor",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  describe("createAssignmentAction with past due dates", () => {
    it("should reject assignment creation when due date is in the past", async () => {
      // Create a date that is clearly in the past (yesterday)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pastDueDate = yesterday.toISOString();

      const formData = new FormData();
      formData.set("title", "Test Assignment");
      formData.set("description", "Test Description");
      formData.set("course_id", "course-123");
      formData.set("due_date", pastDueDate);
      formData.set("max_points", "100");
      formData.set("assignment_type", "homework");
      formData.set("status", "published");
      formData.set("instructions", "Test instructions");

      const result = await createAssignmentAction(formData);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/due date/i);
      expect(result.error).toMatch(/past|future/i);
      
      // Verify that the database insert was NOT called
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });

    it("should reject assignment creation when due date is 1 hour in the past", async () => {
      // Create a date that is 1 hour in the past
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      const pastDueDate = oneHourAgo.toISOString();

      const formData = new FormData();
      formData.set("title", "Test Assignment");
      formData.set("description", "Test Description");
      formData.set("course_id", "course-123");
      formData.set("due_date", pastDueDate);
      formData.set("max_points", "100");
      formData.set("assignment_type", "homework");
      formData.set("status", "published");
      formData.set("instructions", "Test instructions");

      const result = await createAssignmentAction(formData);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/due date/i);
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });

    it("should allow assignment creation when due date is in the future", async () => {
      // Create a date that is clearly in the future (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDueDate = tomorrow.toISOString();

      const formData = new FormData();
      formData.set("title", "Test Assignment");
      formData.set("description", "Test Description");
      formData.set("course_id", "course-123");
      formData.set("due_date", futureDueDate);
      formData.set("max_points", "100");
      formData.set("assignment_type", "homework");
      formData.set("status", "published");
      formData.set("instructions", "Test instructions");

      // Mock successful insert
      mockSupabaseClient.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "assignment-123", title: "Test Assignment" },
            error: null,
          }),
        }),
      });

      const result = await createAssignmentAction(formData);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("assignments");
    });

    it("should allow assignment creation when due date is 1 hour in the future", async () => {
      // Create a date that is 1 hour in the future
      const oneHourFromNow = new Date();
      oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
      const futureDueDate = oneHourFromNow.toISOString();

      const formData = new FormData();
      formData.set("title", "Test Assignment");
      formData.set("description", "Test Description");
      formData.set("course_id", "course-123");
      formData.set("due_date", futureDueDate);
      formData.set("max_points", "100");
      formData.set("assignment_type", "homework");
      formData.set("status", "published");
      formData.set("instructions", "Test instructions");

      // Mock successful insert
      mockSupabaseClient.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "assignment-123", title: "Test Assignment" },
            error: null,
          }),
        }),
      });

      const result = await createAssignmentAction(formData);

      expect(result.success).toBe(true);
    });

    it("should allow draft assignments with past due dates", async () => {
      // Draft assignments might be intentionally set in the past for testing or archival
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pastDueDate = yesterday.toISOString();

      const formData = new FormData();
      formData.set("title", "Test Draft Assignment");
      formData.set("description", "Test Description");
      formData.set("course_id", "course-123");
      formData.set("due_date", pastDueDate);
      formData.set("max_points", "100");
      formData.set("assignment_type", "homework");
      formData.set("status", "draft");
      formData.set("instructions", "Test instructions");

      // Mock successful insert
      mockSupabaseClient.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "assignment-123", title: "Test Draft Assignment" },
            error: null,
          }),
        }),
      });

      const result = await createAssignmentAction(formData);

      expect(result.success).toBe(true);
    });
  });

  describe("updateAssignmentAction with past due dates", () => {
    it("should reject assignment update when due date is changed to the past", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pastDueDate = yesterday.toISOString();

      const formData = new FormData();
      formData.set("title", "Updated Assignment");
      formData.set("description", "Updated Description");
      formData.set("course_id", "course-123");
      formData.set("due_date", pastDueDate);
      formData.set("max_points", "100");
      formData.set("assignment_type", "homework");
      formData.set("status", "published");
      formData.set("instructions", "Updated instructions");

      const result = await updateAssignmentAction("assignment-123", formData);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/due date/i);
      expect(result.error).toMatch(/past|future/i);
      expect(mockSupabaseClient.update).not.toHaveBeenCalled();
    });

    it("should allow updating assignment when due date remains in the future", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDueDate = tomorrow.toISOString();

      const formData = new FormData();
      formData.set("title", "Updated Assignment");
      formData.set("description", "Updated Description");
      formData.set("course_id", "course-123");
      formData.set("due_date", futureDueDate);
      formData.set("max_points", "100");
      formData.set("assignment_type", "homework");
      formData.set("status", "published");
      formData.set("instructions", "Updated instructions");

      // Mock successful update
      mockSupabaseClient.update.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        mockResolvedValue: jest.fn().mockResolvedValue({
          error: null,
        }),
      });
      mockSupabaseClient.eq.mockResolvedValue({ error: null });

      const result = await updateAssignmentAction("assignment-123", formData);

      expect(result.success).toBe(true);
    });

    it("should allow updating draft assignments to past due dates", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pastDueDate = yesterday.toISOString();

      const formData = new FormData();
      formData.set("title", "Updated Draft Assignment");
      formData.set("description", "Updated Description");
      formData.set("course_id", "course-123");
      formData.set("due_date", pastDueDate);
      formData.set("max_points", "100");
      formData.set("assignment_type", "homework");
      formData.set("status", "draft");
      formData.set("instructions", "Updated instructions");

      // Mock successful update
      mockSupabaseClient.update.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        mockResolvedValue: jest.fn().mockResolvedValue({
          error: null,
        }),
      });
      mockSupabaseClient.eq.mockResolvedValue({ error: null });

      const result = await updateAssignmentAction("assignment-123", formData);

      expect(result.success).toBe(true);
    });
  });

  describe("Edge cases and timezone handling", () => {
    it("should validate using server time, not client time", async () => {
      // This test ensures we're using server-side validation
      // Client might send a "future" timestamp in their timezone, 
      // but it could be past in server timezone
      
      // Get current server time
      const now = new Date();
      
      // Create a date 5 minutes in the past (server time)
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const pastDueDate = fiveMinutesAgo.toISOString();

      const formData = new FormData();
      formData.set("title", "Test Assignment");
      formData.set("description", "Test Description");
      formData.set("course_id", "course-123");
      formData.set("due_date", pastDueDate);
      formData.set("max_points", "100");
      formData.set("assignment_type", "homework");
      formData.set("status", "published");
      formData.set("instructions", "Test instructions");

      const result = await createAssignmentAction(formData);

      expect(result.success).toBe(false);
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });

    it("should handle invalid date formats gracefully", async () => {
      const formData = new FormData();
      formData.set("title", "Test Assignment");
      formData.set("description", "Test Description");
      formData.set("course_id", "course-123");
      formData.set("due_date", "invalid-date");
      formData.set("max_points", "100");
      formData.set("assignment_type", "homework");
      formData.set("status", "published");
      formData.set("instructions", "Test instructions");

      const result = await createAssignmentAction(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("Authorization checks", () => {
    it("should still validate due date after authorization", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pastDueDate = yesterday.toISOString();

      const formData = new FormData();
      formData.set("title", "Test Assignment");
      formData.set("description", "Test Description");
      formData.set("course_id", "course-123");
      formData.set("due_date", pastDueDate);
      formData.set("max_points", "100");
      formData.set("assignment_type", "homework");
      formData.set("status", "published");
      formData.set("instructions", "Test instructions");

      const result = await createAssignmentAction(formData);

      // Ensure auth was checked first
      expect(mockRequireAuth).toHaveBeenCalled();
      // But due date validation should also fail
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/due date/i);
    });
  });
});

