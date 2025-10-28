import { uploadSubmissionDocument, deleteSubmissionDocument } from "@/lib/submission-actions";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/user-utils";

// Mock dependencies
jest.mock("@/utils/supabase/server");
jest.mock("@/lib/user-utils");
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("Student Document Upload Actions", () => {
  let mockSupabase: any;
  let mockStorage: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock storage
    mockStorage = {
      from: jest.fn().mockReturnThis(),
      upload: jest.fn(),
      createSignedUrl: jest.fn(),
      remove: jest.fn(),
    };

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      storage: mockStorage,
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe("uploadSubmissionDocument", () => {
    const mockFile = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(mockFile, "size", { value: 5 * 1024 * 1024 }); // 5MB

    const assignmentId = "assignment-123";
    const studentId = "student-456";

    beforeEach(() => {
      // Mock authenticated student
      (requireAuth as jest.Mock).mockResolvedValue({
        id: studentId,
        role: "student",
        email: "student@test.com",
      });
    });

    test("should successfully upload a valid PDF file", async () => {
      // Mock assignment check
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: assignmentId,
          status: "published",
          due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          course_id: "course-789",
        },
        error: null,
      });

      // Mock enrollment check
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "enrollment-1", status: "active" },
        error: null,
      });

      // Mock storage upload
      mockStorage.upload.mockResolvedValue({
        data: { path: "test-path" },
        error: null,
      });

      // Mock signed URL generation
      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://storage.example.com/signed-url" },
        error: null,
      });

      const result = await uploadSubmissionDocument(mockFile, assignmentId);

      expect(result.success).toBe(true);
      expect(result.fileAttachment).toBeDefined();
      expect(result.fileAttachment?.name).toBe("test.pdf");
      expect(result.fileAttachment?.type).toBe("application/pdf");
      expect(result.fileAttachment?.url).toBe("https://storage.example.com/signed-url");
      expect(mockStorage.upload).toHaveBeenCalledWith(
        expect.stringContaining(studentId),
        mockFile,
        expect.any(Object)
      );
    });

    test("should successfully upload a valid image file", async () => {
      const imageFile = new File(["image content"], "photo.png", {
        type: "image/png",
      });
      Object.defineProperty(imageFile, "size", { value: 2 * 1024 * 1024 }); // 2MB

      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: assignmentId,
            status: "published",
            due_date: new Date(Date.now() + 86400000).toISOString(),
            course_id: "course-789",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "enrollment-1", status: "active" },
          error: null,
        });

      mockStorage.upload.mockResolvedValue({ data: { path: "test-path" }, error: null });
      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://storage.example.com/image-url" },
        error: null,
      });

      const result = await uploadSubmissionDocument(imageFile, assignmentId);

      expect(result.success).toBe(true);
      expect(result.fileAttachment?.type).toBe("image/png");
    });

    test("should reject non-student user", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        id: "instructor-123",
        role: "instructor",
        email: "instructor@test.com",
      });

      const result = await uploadSubmissionDocument(mockFile, assignmentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Only students can upload submission documents");
    });

    test("should reject invalid file type", async () => {
      const invalidFile = new File(["content"], "test.exe", {
        type: "application/x-msdownload",
      });
      Object.defineProperty(invalidFile, "size", { value: 1024 });

      const result = await uploadSubmissionDocument(invalidFile, assignmentId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid file type");
    });

    test("should reject file larger than 50MB", async () => {
      const largeFile = new File(["content"], "large.pdf", {
        type: "application/pdf",
      });
      Object.defineProperty(largeFile, "size", { value: 51 * 1024 * 1024 }); // 51MB

      const result = await uploadSubmissionDocument(largeFile, assignmentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("File size must be less than 50MB");
    });

    test("should reject upload after due date", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: assignmentId,
          status: "published",
          due_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          course_id: "course-789",
        },
        error: null,
      });

      const result = await uploadSubmissionDocument(mockFile, assignmentId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("due date has passed");
    });

    test("should reject non-enrolled student", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: assignmentId,
            status: "published",
            due_date: new Date(Date.now() + 86400000).toISOString(),
            course_id: "course-789",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Not found" },
        });

      const result = await uploadSubmissionDocument(mockFile, assignmentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("You are not enrolled in this course");
    });

    test("should reject unpublished assignment", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      const result = await uploadSubmissionDocument(mockFile, assignmentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Assignment not found or not published");
    });

    test("should sanitize filename with special characters", async () => {
      const specialFile = new File(["content"], "my file!@#$%.pdf", {
        type: "application/pdf",
      });
      Object.defineProperty(specialFile, "size", { value: 1024 });

      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: assignmentId,
            status: "published",
            due_date: new Date(Date.now() + 86400000).toISOString(),
            course_id: "course-789",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "enrollment-1", status: "active" },
          error: null,
        });

      mockStorage.upload.mockResolvedValue({ data: { path: "test-path" }, error: null });
      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://storage.example.com/url" },
        error: null,
      });

      const result = await uploadSubmissionDocument(specialFile, assignmentId);

      expect(result.success).toBe(true);
      expect(mockStorage.upload).toHaveBeenCalledWith(
        expect.stringContaining("my_file_____"),
        specialFile,
        expect.any(Object)
      );
    });

    test("should handle storage upload failure", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: assignmentId,
            status: "published",
            due_date: new Date(Date.now() + 86400000).toISOString(),
            course_id: "course-789",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "enrollment-1", status: "active" },
          error: null,
        });

      mockStorage.upload.mockResolvedValue({
        data: null,
        error: { message: "Storage error" },
      });

      const result = await uploadSubmissionDocument(mockFile, assignmentId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Upload failed");
    });

    test("should cleanup file if URL generation fails", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: assignmentId,
            status: "published",
            due_date: new Date(Date.now() + 86400000).toISOString(),
            course_id: "course-789",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "enrollment-1", status: "active" },
          error: null,
        });

      mockStorage.upload.mockResolvedValue({ data: { path: "test-path" }, error: null });
      mockStorage.createSignedUrl.mockResolvedValue({
        data: null,
        error: { message: "URL generation failed" },
      });

      const result = await uploadSubmissionDocument(mockFile, assignmentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to generate file URL");
      expect(mockStorage.remove).toHaveBeenCalled();
    });
  });

  describe("deleteSubmissionDocument", () => {
    const fileUrl = "https://storage.example.com/storage/v1/object/submission-files/student-456/assignment-123/file.pdf";
    const assignmentId = "assignment-123";
    const studentId = "student-456";

    beforeEach(() => {
      (requireAuth as jest.Mock).mockResolvedValue({
        id: studentId,
        role: "student",
        email: "student@test.com",
      });
    });

    test("should successfully delete own file", async () => {
      // Mock submission check
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "submission-1",
          status: "submitted",
          assignment_id: assignmentId,
        },
        error: null,
      });

      // Mock assignment check
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          due_date: new Date(Date.now() + 86400000).toISOString(),
        },
        error: null,
      });

      mockStorage.remove.mockResolvedValue({ error: null });

      const result = await deleteSubmissionDocument(fileUrl, assignmentId);

      expect(result.success).toBe(true);
      expect(mockStorage.remove).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining(studentId)])
      );
    });

    test("should reject non-student user", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        id: "instructor-123",
        role: "instructor",
        email: "instructor@test.com",
      });

      const result = await deleteSubmissionDocument(fileUrl, assignmentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Only students can delete submission documents");
    });

    test("should reject deletion of graded submission", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "submission-1",
          status: "graded",
          assignment_id: assignmentId,
        },
        error: null,
      });

      const result = await deleteSubmissionDocument(fileUrl, assignmentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Cannot delete files from a graded submission");
    });

    test("should reject deletion after due date", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "submission-1",
            status: "submitted",
            assignment_id: assignmentId,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            due_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          },
          error: null,
        });

      const result = await deleteSubmissionDocument(fileUrl, assignmentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Cannot delete files after the due date");
    });

    test("should reject deletion of other student's file", async () => {
      const otherStudentUrl = "https://storage.example.com/storage/v1/object/submission-files/other-student/assignment-123/file.pdf";

      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "submission-1",
            status: "submitted",
            assignment_id: assignmentId,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            due_date: new Date(Date.now() + 86400000).toISOString(),
          },
          error: null,
        });

      const result = await deleteSubmissionDocument(otherStudentUrl, assignmentId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });

    test("should reject invalid file URL", async () => {
      const invalidUrl = "https://example.com/invalid-path";

      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "submission-1",
            status: "submitted",
            assignment_id: assignmentId,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            due_date: new Date(Date.now() + 86400000).toISOString(),
          },
          error: null,
        });

      const result = await deleteSubmissionDocument(invalidUrl, assignmentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid file URL");
    });

    test("should handle storage deletion failure", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "submission-1",
            status: "submitted",
            assignment_id: assignmentId,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            due_date: new Date(Date.now() + 86400000).toISOString(),
          },
          error: null,
        });

      mockStorage.remove.mockResolvedValue({
        error: { message: "Storage deletion failed" },
      });

      const result = await deleteSubmissionDocument(fileUrl, assignmentId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Delete failed");
    });

    test("should reject if submission not found", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      const result = await deleteSubmissionDocument(fileUrl, assignmentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Submission not found");
    });
  });
});
