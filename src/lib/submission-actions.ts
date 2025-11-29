"use server";

/**
 * Submission Actions
 * 
 * This module provides server actions for managing student submissions and document uploads.
 * 
 * Key actions for students:
 * - uploadSubmissionDocument: Upload assignment files (PDF, images, text) to submission-files bucket
 * - deleteSubmissionDocument: Delete uploaded files before grading or due date
 * - createSubmission: Submit an assignment with content and attachments
 * 
 * Security features:
 * - Role-based access control (students only)
 * - Course enrollment verification
 * - Due date enforcement
 * - File type and size validation (50MB limit)
 * - Automatic file cleanup on errors
 * - Signed URLs for private bucket access
 */

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "./user-utils";
import { revalidatePath } from "next/cache";
import { saveRubricScores, getRubricByAssignment } from "./rubric-actions";
import { triggerAIGrading } from "./ai-grading-actions";

export interface FileAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
  uploaded_at: string;
}

export async function createSubmission(
  assignmentId: string,
  content: string,
  attachments: FileAttachment[] = []
) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "student") {
    return { success: false, error: "Only students can submit assignments" };
  }

  const supabase = await createClient();

  // Check if assignment exists and is published
  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("id, status, due_date, course_id")
    .eq("id", assignmentId)
    .eq("status", "published")
    .single();

  if (assignmentError || !assignment) {
    return { success: false, error: "Assignment not found or not published" };
  }

  // Check if due date has passed with 24-hour grace period
  const now = new Date();
  const dueDate = new Date(assignment.due_date);
  const gracePeriodEnd = new Date(dueDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours after due date
  const isLate = now > dueDate && now <= gracePeriodEnd;

  // Reject if past grace period (24 hours after due date)
  if (now > gracePeriodEnd) {
    return {
      success: false,
      error: "Assignment is no longer accepting submissions. The 24-hour grace period has ended.",
    };
  }

  // Check if student is enrolled in the course
  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("student_id", userProfile.id)
    .eq("course_id", assignment.course_id)
    .single();

  if (!enrollment) {
    return { success: false, error: "You are not enrolled in this course" };
  }

  // Check if submission already exists
  const { data: existingSubmission } = await supabase
    .from("submissions")
    .select("id, status")
    .eq("assignment_id", assignmentId)
    .eq("student_id", userProfile.id)
    .single();

  if (existingSubmission) {
    // Update existing submission
    const { error } = await supabase
      .from("submissions")
      .update({
        content,
        attachments,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_late: isLate,
      })
      .eq("id", existingSubmission.id);

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    // Create new submission
    const { error } = await supabase.from("submissions").insert({
      assignment_id: assignmentId,
      student_id: userProfile.id,
      content,
      attachments,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      is_late: isLate,
    });

    if (error) {
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/dashboard/student");

  // Get the submission ID for notifications and AI grading
  const { data: newSubmission } = await supabase
    .from("submissions")
    .select("id")
    .eq("assignment_id", assignmentId)
    .eq("student_id", userProfile.id)
    .single();

  // Send notification to instructor/TAs about document upload
  if (attachments.length > 0 && newSubmission) {
    const { notifyDocumentUploaded } = await import("@/lib/notification-actions");
    await notifyDocumentUploaded({
      documentId: newSubmission.id,
      studentId: userProfile.id,
      assignmentId: assignmentId,
      fileName: attachments.map(a => a.name).join(", "),
      courseId: assignment.course_id,
    }).catch((err) => console.error("Failed to send notification:", err));
  }

  // Trigger AI grading if assignment has a rubric and PDF attachments
  if (
    attachments.length > 0 &&
    attachments.some((att) => att.type === "application/pdf") &&
    newSubmission
  ) {
    // Trigger AI grading asynchronously (don't wait for it)
    triggerAIGrading(newSubmission.id).catch((error) => {
      console.error("AI grading failed:", error);
      // Don't fail the submission if AI grading fails
    });
  }

  return { success: true, error: null };
}

export async function uploadFileToStorage(
  file: File,
  assignmentId: string,
  studentId: string
): Promise<{
  success: boolean;
  fileAttachment?: FileAttachment;
  error?: string;
}> {
  const supabase = await createClient();

  // Validate file type
  if (file.type !== "application/pdf") {
    return { success: false, error: "Only PDF files are allowed" };
  }

  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { success: false, error: "File size must be less than 10MB" };
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${studentId}/${assignmentId}/${Date.now()}.${fileExt}`;

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("assignments")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("assignments")
      .getPublicUrl(fileName);

    const fileAttachment: FileAttachment = {
      name: file.name,
      url: urlData.publicUrl,
      size: file.size,
      type: file.type,
      uploaded_at: new Date().toISOString(),
    };

    return { success: true, fileAttachment };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload a document for a student submission
 * This action is specifically for students to upload their assignment submissions
 */
export async function uploadSubmissionDocument(
  file: File,
  assignmentId: string
): Promise<{
  success: boolean;
  fileAttachment?: FileAttachment;
  error?: string;
}> {
  const userProfile = await requireAuth();

  // Only students can upload submission documents
  if (userProfile.role !== "student") {
    return { success: false, error: "Only students can upload submission documents" };
  }

  const supabase = await createClient();

  // Verify assignment exists and is published
  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("id, status, due_date, course_id, max_points")
    .eq("id", assignmentId)
    .eq("status", "published")
    .single();

  if (assignmentError || !assignment) {
    return { success: false, error: "Assignment not found or not published" };
  }

  // Check if due date has passed with 24-hour grace period
  const now = new Date();
  const dueDate = new Date(assignment.due_date);
  const gracePeriodEnd = new Date(dueDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours after due date

  // Reject if past grace period (24 hours after due date)
  if (now > gracePeriodEnd) {
    return {
      success: false,
      error: "Assignment is no longer accepting submissions. The 24-hour grace period has ended. Cannot upload documents.",
    };
  }

  // Verify student is enrolled in the course
  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id, status")
    .eq("student_id", userProfile.id)
    .eq("course_id", assignment.course_id)
    .eq("status", "active")
    .single();

  if (!enrollment) {
    return { success: false, error: "You are not enrolled in this course" };
  }

  // Validate file type - allow PDF, images, and text files
  const allowedTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "text/plain"
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: "Invalid file type. Allowed types: PDF, PNG, JPEG, JPG, TXT"
    };
  }

  // Validate file size (50MB limit as per storage bucket config)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { success: false, error: "File size must be less than 50MB" };
  }

  // Validate file name
  if (!file.name || file.name.length > 255) {
    return { success: false, error: "Invalid file name" };
  }

  // Generate unique filename with student ID folder structure
  const fileExt = file.name.split(".").pop();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const timestamp = Date.now();
  const fileName = `${userProfile.id}/${assignmentId}/${timestamp}_${sanitizedFileName}`;

  try {
    // Upload file to submission-files bucket
    const { data, error } = await supabase.storage
      .from("submission-files")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return { success: false, error: `Upload failed: ${error.message}` };
    }

    // Get signed URL for private bucket (valid for 1 year)
    const { data: urlData, error: urlError } = await supabase.storage
      .from("submission-files")
      .createSignedUrl(fileName, 31536000); // 1 year in seconds

    if (urlError || !urlData) {
      // Cleanup uploaded file if URL generation fails
      await supabase.storage.from("submission-files").remove([fileName]);
      return { success: false, error: "Failed to generate file URL" };
    }

    const fileAttachment: FileAttachment = {
      name: file.name,
      url: urlData.signedUrl,
      size: file.size,
      type: file.type,
      uploaded_at: new Date().toISOString(),
    };

    return { success: true, fileAttachment };
  } catch (error) {
    console.error("Upload exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed unexpectedly",
    };
  }
}

export async function deleteFileFromStorage(
  fileUrl: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Extract file path from URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split("/");
    const fileName = pathParts[pathParts.length - 1];
    const filePath = pathParts.slice(-3).join("/"); // Get last 3 parts (studentId/assignmentId/filename)

    const { error } = await supabase.storage
      .from("assignments")
      .remove([filePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Delete a submission document uploaded by a student
 * Students can only delete their own files before the assignment is graded
 */
export async function deleteSubmissionDocument(
  fileUrl: string,
  assignmentId: string
): Promise<{ success: boolean; error?: string }> {
  const userProfile = await requireAuth();

  // Only students can delete their submission documents
  if (userProfile.role !== "student") {
    return { success: false, error: "Only students can delete submission documents" };
  }

  const supabase = await createClient();

  // Check if submission exists and is not yet graded
  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select("id, status, assignment_id")
    .eq("assignment_id", assignmentId)
    .eq("student_id", userProfile.id)
    .single();

  if (submissionError || !submission) {
    return { success: false, error: "Submission not found" };
  }

  // Prevent deletion if already graded
  if (submission.status === "graded") {
    return { success: false, error: "Cannot delete files from a graded submission" };
  }

  // Verify assignment due date hasn't passed (including grace period)
  const { data: assignment } = await supabase
    .from("assignments")
    .select("due_date")
    .eq("id", assignmentId)
    .single();

  if (assignment) {
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const gracePeriodEnd = new Date(dueDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours after due date
    
    if (now > gracePeriodEnd) {
      return {
        success: false,
        error: "Cannot delete files after the grace period has ended",
      };
    }
  }

  try {
    // Extract file path from URL (handle both signed URLs and regular URLs)
    const url = new URL(fileUrl);
    const pathMatch = url.pathname.match(/submission-files\/(.+)/);
    
    if (!pathMatch) {
      return { success: false, error: "Invalid file URL" };
    }

    const filePath = pathMatch[1];

    // Verify the file belongs to the current user
    if (!filePath.startsWith(userProfile.id)) {
      return { success: false, error: "Unauthorized: You can only delete your own files" };
    }

    // Delete file from storage
    const { error } = await supabase.storage
      .from("submission-files")
      .remove([filePath]);

    if (error) {
      console.error("Storage deletion error:", error);
      return { success: false, error: `Delete failed: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed unexpectedly",
    };
  }
}

export async function gradeSubmission(
  submissionId: string,
  grade: number,
  feedback?: string,
  rubricScores?: Record<string, number>
) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "ta" && userProfile.role !== "instructor") {
    return {
      success: false,
      error: "Only TAs and instructors can grade submissions",
    };
  }

  const supabase = await createClient();

  // Check if submission exists
  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select("id, assignment_id, status")
    .eq("id", submissionId)
    .single();

  if (submissionError || !submission) {
    return { success: false, error: "Submission not found" };
  }

  if (submission.status !== "submitted") {
    return {
      success: false,
      error: "Only submitted assignments can be graded",
    };
  }

  let finalGrade = grade;

  // Handle rubric-based grading if rubric scores are provided
  if (rubricScores) {
    // Get rubric for this assignment
    const rubricResult = await getRubricByAssignment(submission.assignment_id);
    if (!rubricResult.success || !rubricResult.rubric) {
      return { success: false, error: "Rubric not found for this assignment" };
    }

    // Save rubric scores
    const rubricScoresResult = await saveRubricScores(
      submissionId,
      rubricResult.rubric.id,
      rubricScores,
      userProfile.id
    );

    if (!rubricScoresResult.success) {
      return { success: false, error: rubricScoresResult.error };
    }

    // Calculate total from rubric scores
    finalGrade = Object.values(rubricScores).reduce(
      (sum, score) => sum + score,
      0
    );
  } else {
    // Traditional grading - validate grade
    if (grade < 0 || grade > 100) {
      return { success: false, error: "Grade must be between 0 and 100" };
    }
  }

  // Get student ID from submission
  const { data: submissionData } = await supabase
    .from("submissions")
    .select("student_id")
    .eq("id", submissionId)
    .single();

  // Update submission with grade
  const { error } = await supabase
    .from("submissions")
    .update({
      grade: finalGrade,
      feedback: feedback || null,
      status: "graded",
      graded_by: userProfile.id,
      graded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Send notification to student
  if (submissionData?.student_id) {
    const { notifySubmissionGraded } = await import("@/lib/notification-actions");
    await notifySubmissionGraded({
      submissionId,
      studentId: submissionData.student_id,
      assignmentId: submission.assignment_id,
      grade: finalGrade,
      feedback: feedback,
      gradedBy: userProfile.id,
    }).catch((err) => console.error("Failed to send notification:", err));
  }

  revalidatePath("/dashboard/ta");
  revalidatePath("/dashboard/instructor");
  revalidatePath("/dashboard/student");
  return { success: true, error: null };
}

export async function getSubmissionDetails(submissionId: string) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "ta" && userProfile.role !== "instructor") {
    return {
      success: false,
      error: "Only TAs and instructors can view submission details",
    };
  }

  const supabase = await createClient();

  const { data: submission, error } = await supabase
    .from("submissions")
    .select(
      `
      *,
      assignment:assignment_id (
        id,
        title,
        description,
        instructions,
        max_points,
        due_date,
        course:course_id (
          id,
          name,
          code
        )
      ),
      student:student_id (
        id,
        first_name,
        last_name,
        email
      )
    `
    )
    .eq("id", submissionId)
    .single();

  if (error || !submission) {
    return { success: false, error: "Submission not found" };
  }

  return { success: true, submission };
}
