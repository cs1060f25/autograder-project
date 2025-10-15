"use server";

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

  // Check if due date has passed
  const now = new Date();
  const dueDate = new Date(assignment.due_date);
  if (now > dueDate) {
    return { success: false, error: "Assignment due date has passed" };
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
    });

    if (error) {
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/dashboard/student");

  // Trigger AI grading if assignment has a rubric and PDF attachments
  if (
    attachments.length > 0 &&
    attachments.some((att) => att.type === "application/pdf")
  ) {
    // Get the submission ID for AI grading
    const { data: newSubmission } = await supabase
      .from("submissions")
      .select("id")
      .eq("assignment_id", assignmentId)
      .eq("student_id", userProfile.id)
      .single();

    if (newSubmission) {
      // Trigger AI grading asynchronously (don't wait for it)
      triggerAIGrading(newSubmission.id).catch((error) => {
        console.error("AI grading failed:", error);
        // Don't fail the submission if AI grading fails
      });
    }
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
