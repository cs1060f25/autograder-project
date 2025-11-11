"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "./user-utils";
import { revalidatePath } from "next/cache";
import { AutograderService } from "@/services/autograder";
import type { SubmissionDocument } from "@/services/autograder";

export interface AIGradeData {
  totalAwarded: number;
  totalPossible: number;
  items: Array<{
    id: string;
    label: string;
    maxPoints: number;
    points: number;
    comments: string;
  }>;
  overallFeedback: string;
}

export interface AIGradingStatus {
  status: "pending" | "completed" | "failed" | "regenerated";
  ai_grade_data?: AIGradeData;
  ai_graded_at?: string;
  error?: string;
}

/**
 * Trigger AI grading for a submission using the AutograderService
 * This function now uses the core autograder orchestration service
 */
export async function triggerAIGrading(submissionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const userProfile = await requireAuth();

  if (
    userProfile.role !== "student" &&
    userProfile.role !== "ta" &&
    userProfile.role !== "instructor"
  ) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  try {
    // Get submission details including attachments
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select(
        `
        id,
        assignment_id,
        attachments,
        assignment:assignment_id (
          id,
          title
        )
      `
      )
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      return { success: false, error: "Submission not found" };
    }

    // Get assignment details
    const assignment = Array.isArray(submission.assignment)
      ? submission.assignment[0]
      : submission.assignment;

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    // Transform attachments to SubmissionDocument format
    const documents: SubmissionDocument[] = (submission.attachments || []).map(
      (attachment: any) => ({
        id: attachment.id || `${submissionId}-${attachment.name}`,
        url: attachment.url,
        name: attachment.name,
        type: attachment.type,
        size: attachment.size || 0,
      })
    );

    // Initialize AutograderService
    const autograderService = new AutograderService();

    // Check if service is ready
    const isReady = await autograderService.isReady();
    if (!isReady) {
      return { 
        success: false, 
        error: "Autograder service is not ready. Please check configuration." 
      };
    }

    // Execute autograding using the orchestration service
    const result = await autograderService.autograde({
      submissionId,
      assignmentId: assignment.id,
      documents,
    });

    // Map AutogradeResult to response format
    if (result.status === "completed") {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: result.error || `Autograding failed with status: ${result.status}` 
      };
    }
  } catch (error) {
    console.error("AI grading error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI grading failed",
    };
  }
}

export async function regenerateAIGrade(submissionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const userProfile = await requireAuth();

  if (userProfile.role !== "ta" && userProfile.role !== "instructor") {
    return {
      success: false,
      error: "Only TAs and instructors can regenerate AI grades",
    };
  }

  // Update status to indicate regeneration
  const supabase = await createClient();
  await supabase
    .from("submissions")
    .update({
      ai_grade_status: "regenerated",
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  // Trigger AI grading again
  return await triggerAIGrading(submissionId);
}

/**
 * Get AI grading status for a submission using the AutograderService
 */
export async function getAIGradingStatus(submissionId: string): Promise<{
  success: boolean;
  status?: AIGradingStatus;
  error?: string;
}> {
  const userProfile = await requireAuth();

  if (
    userProfile.role !== "ta" &&
    userProfile.role !== "instructor" &&
    userProfile.role !== "student"
  ) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Use AutograderService to get status
    const autograderService = new AutograderService();
    const result = await autograderService.getStatus(submissionId);

    // Map AutogradeStatus to AIGradingStatus
    let mappedStatus: AIGradingStatus["status"];
    switch (result.status) {
      case "completed":
        mappedStatus = "completed";
        break;
      case "processing":
      case "pending":
        mappedStatus = "pending";
        break;
      case "failed":
      case "no_rubric":
      case "no_documents":
        mappedStatus = "failed";
        break;
      default:
        mappedStatus = "pending";
    }

    return {
      success: true,
      status: {
        status: mappedStatus,
        ai_grade_data: result.result ? {
          totalAwarded: result.result.totalAwarded!,
          totalPossible: result.result.totalPossible!,
          items: result.result.items!,
          overallFeedback: result.result.overallFeedback!,
        } : undefined,
        ai_graded_at: result.result?.gradedAt,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get AI grading status",
    };
  }
}
