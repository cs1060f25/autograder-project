"use server";

/**
 * Regrade Request Actions
 * Server actions for student regrade request functionality
 */

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "./user-utils";
import type {
  CreateRegradeRequestParams,
  ResolveRegradeRequestParams,
  RegradeRequestResponse,
  RegradeRequestListResponse,
  RegradeAuditMetadata,
} from "@/types/regrade";

/**
 * Submit a regrade request for a specific rubric item deduction
 */
export async function submitRegradeRequest(
  params: CreateRegradeRequestParams
): Promise<RegradeRequestResponse> {
  try {
    const userProfile = await requireAuth();
    const supabase = await createClient();

    // Validate student explanation
    if (!params.studentExplanation || params.studentExplanation.trim().length === 0) {
      return {
        success: false,
        error: "Student explanation is required and cannot be empty",
      };
    }

    if (params.studentExplanation.length > 5000) {
      return {
        success: false,
        error: "Student explanation must be less than 5000 characters",
      };
    }

    // Verify the submission belongs to the student
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, student_id, assignment_id, status, ai_grade_data")
      .eq("id", params.submissionId)
      .single();

    if (submissionError || !submission) {
      return {
        success: false,
        error: "Submission not found",
      };
    }

    if (submission.student_id !== userProfile.id) {
      return {
        success: false,
        error: "You can only submit regrade requests for your own submissions",
      };
    }

    if (submission.status !== "graded") {
      return {
        success: false,
        error: "You can only request regrades for graded submissions",
      };
    }

    // Rate limiting: Check number of pending requests in the last 24 hours
    const RATE_LIMIT = 10; // Maximum requests per 24 hours
    const RATE_LIMIT_WINDOW_HOURS = 24;
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - RATE_LIMIT_WINDOW_HOURS);

    const { count: recentRequestCount, error: countError } = await supabase
      .from("regrade_requests")
      .select("*", { count: "exact", head: true })
      .eq("student_id", userProfile.id)
      .gte("created_at", windowStart.toISOString());

    if (countError) {
      console.error("Error checking rate limit:", countError);
      return {
        success: false,
        error: "Failed to verify rate limit",
      };
    }

    if (recentRequestCount !== null && recentRequestCount >= RATE_LIMIT) {
      return {
        success: false,
        error: `You have exceeded the maximum number of regrade requests (${RATE_LIMIT}) in the last ${RATE_LIMIT_WINDOW_HOURS} hours. Please try again later.`,
      };
    }

    // Verify the rubric score exists and belongs to this submission
    const { data: rubricScore, error: rubricScoreError } = await supabase
      .from("rubric_scores")
      .select("id, submission_id, scores, ai_comments, graded_by, graded_at")
      .eq("id", params.rubricScoreId)
      .eq("submission_id", params.submissionId)
      .single();

    if (rubricScoreError || !rubricScore) {
      return {
        success: false,
        error: "Rubric score not found for this submission",
      };
    }

    // Check if there's already an active regrade request for this rubric item
    const { data: existingRequest, error: existingError } = await supabase
      .from("regrade_requests")
      .select("id, status")
      .eq("submission_id", params.submissionId)
      .eq("rubric_item_id", params.rubricItemId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingError) {
      console.error("Error checking for existing requests:", existingError);
      return {
        success: false,
        error: "Failed to check for existing regrade requests",
      };
    }

    if (existingRequest) {
      return {
        success: false,
        error: "You already have a pending regrade request for this rubric item",
      };
    }

    // Extract audit metadata from rubric scores and AI data
    const scores = rubricScore.scores as any;
    const aiComments = rubricScore.ai_comments as any;
    const rubricItemScore = scores[params.rubricItemId];

    if (rubricItemScore === undefined) {
      return {
        success: false,
        error: "Rubric item not found in grading data",
      };
    }

    // Build immutable audit metadata
    const auditMetadata: RegradeAuditMetadata = {
      rubric_rule_id: params.rubricItemId,
      original_deduction: rubricItemScore,
      ai_rationale: aiComments?.[params.rubricItemId]?.rationale || aiComments?.[params.rubricItemId],
      ai_grade_data: submission.ai_grade_data,
      ta_override_history: [], // TODO: Track TA overrides if implemented
    };

    // Get rubric criterion details for context
    const { data: rubric } = await supabase
      .from("rubrics")
      .select("criteria")
      .eq("assignment_id", params.assignmentId)
      .single();

    if (rubric?.criteria) {
      const criteria = rubric.criteria as any[];
      const criterion = criteria.find((c: any) => c.id === params.rubricItemId);
      if (criterion) {
        auditMetadata.rubric_criterion_text = criterion.description || criterion.name;
        auditMetadata.max_points = criterion.max_points || criterion.points || criterion.maxPoints;
      }
    }

    // Create the regrade request
    // The database has a unique constraint on (submission_id, rubric_item_id) for pending requests
    // This prevents race conditions where duplicate requests could be created
    const { data: request, error: insertError } = await supabase
      .from("regrade_requests")
      .insert({
        submission_id: params.submissionId,
        student_id: userProfile.id,
        assignment_id: params.assignmentId,
        rubric_score_id: params.rubricScoreId,
        rubric_item_id: params.rubricItemId,
        student_explanation: params.studentExplanation.trim(),
        status: "pending",
        audit_metadata: auditMetadata,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating regrade request:", insertError);
      
      // Check if this is a unique constraint violation (race condition caught by database)
      // PostgreSQL error code 23505 is for unique_violation
      if (insertError.code === '23505' || insertError.message?.includes('unique_pending_regrade_request')) {
        return {
          success: false,
          error: "A regrade request for this rubric item already exists. This may have been created by a concurrent request.",
        };
      }
      
      return {
        success: false,
        error: "Failed to create regrade request",
      };
    }

    // Notify TAs and instructor about the new regrade request
    const { data: assignmentData } = await supabase
      .from("assignments")
      .select("title")
      .eq("id", params.assignmentId)
      .single();

    await notifyTAsAboutRegradeRequest(
      params.assignmentId,
      `${userProfile.first_name} ${userProfile.last_name}`,
      assignmentData?.title || "Assignment",
      params.rubricItemId
    ).catch(err => console.error("Failed to send notifications:", err));

    return {
      success: true,
      request,
    };
  } catch (error) {
    console.error("Error in submitRegradeRequest:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get all regrade requests for the current user (student view)
 */
export async function getMyRegradeRequests(): Promise<RegradeRequestListResponse> {
  try {
    const userProfile = await requireAuth();
    const supabase = await createClient();

    const { data: requests, error } = await supabase
      .from("regrade_requests")
      .select(`
        *,
        assignments:assignment_id (
          title
        )
      `)
      .eq("student_id", userProfile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching regrade requests:", error);
      return {
        success: false,
        error: "Failed to fetch regrade requests",
      };
    }

    return {
      success: true,
      requests: requests || [],
    };
  } catch (error) {
    console.error("Error in getMyRegradeRequests:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get all regrade requests for assignments the user teaches/TAs (instructor/TA view)
 */
export async function getCourseRegradeRequests(
  courseId?: string
): Promise<RegradeRequestListResponse> {
  try {
    const userProfile = await requireAuth();
    const supabase = await createClient();

    let query = supabase
      .from("regrade_requests")
      .select(`
        *,
        assignments:assignment_id (
          title,
          course_id
        ),
        students:student_id (
          first_name,
          last_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    // Filter by course if specified
    if (courseId) {
      query = query.eq("assignments.course_id", courseId);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error("Error fetching course regrade requests:", error);
      return {
        success: false,
        error: "Failed to fetch regrade requests",
      };
    }

    return {
      success: true,
      requests: requests || [],
    };
  } catch (error) {
    console.error("Error in getCourseRegradeRequests:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Withdraw a pending regrade request (student only)
 */
export async function withdrawRegradeRequest(
  requestId: string
): Promise<RegradeRequestResponse> {
  try {
    const userProfile = await requireAuth();
    const supabase = await createClient();

    // Verify the request belongs to the student and is pending
    const { data: request, error: fetchError } = await supabase
      .from("regrade_requests")
      .select("id, student_id, status")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) {
      return {
        success: false,
        error: "Regrade request not found",
      };
    }

    if (request.student_id !== userProfile.id) {
      return {
        success: false,
        error: "You can only withdraw your own regrade requests",
      };
    }

    if (request.status !== "pending") {
      return {
        success: false,
        error: "Only pending regrade requests can be withdrawn",
      };
    }

    // Update status to withdrawn
    const { data: updatedRequest, error: updateError } = await supabase
      .from("regrade_requests")
      .update({ status: "withdrawn" })
      .eq("id", requestId)
      .select()
      .single();

    if (updateError) {
      console.error("Error withdrawing regrade request:", updateError);
      return {
        success: false,
        error: "Failed to withdraw regrade request",
      };
    }

    return {
      success: true,
      request: updatedRequest,
    };
  } catch (error) {
    console.error("Error in withdrawRegradeRequest:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Resolve a regrade request (instructor/TA only)
 * When approved, triggers grade recalculation and gradebook sync
 */
export async function resolveRegradeRequest(
  params: ResolveRegradeRequestParams
): Promise<RegradeRequestResponse> {
  try {
    const userProfile = await requireAuth();
    const supabase = await createClient();

    // Validate resolution notes
    if (!params.resolutionNotes || params.resolutionNotes.trim().length === 0) {
      return {
        success: false,
        error: "Resolution notes are required",
      };
    }

    // Verify the request exists and is pending
    const { data: request, error: fetchError } = await supabase
      .from("regrade_requests")
      .select(`
        *,
        assignments:assignment_id (
          instructor_id,
          course_id,
          max_points
        )
      `)
      .eq("id", params.requestId)
      .single();

    if (fetchError || !request) {
      return {
        success: false,
        error: "Regrade request not found",
      };
    }

    if (request.status !== "pending") {
      return {
        success: false,
        error: "Only pending regrade requests can be resolved",
      };
    }

    // Verify user is instructor or TA for this course
    const assignment = request.assignments as any;
    const isInstructor = assignment.instructor_id === userProfile.id;

    let isTA = false;
    if (!isInstructor) {
      const { data: taAssignment } = await supabase
        .from("course_ta_assignments")
        .select("id")
        .eq("course_id", assignment.course_id)
        .eq("ta_id", userProfile.id)
        .maybeSingle();

      isTA = !!taAssignment;
    }

    if (!isInstructor && !isTA) {
      return {
        success: false,
        error: "You do not have permission to resolve this regrade request",
      };
    }

    // Validate points awarded if approved
    if (params.status === "approved") {
      if (params.pointsAwarded === undefined || params.pointsAwarded < 0) {
        return {
          success: false,
          error: "Points awarded must be specified and non-negative for approved requests",
        };
      }
    }

    const resolvedAt = new Date().toISOString();

    // Update the regrade request with immutable audit trail
    const { data: updatedRequest, error: updateError } = await supabase
      .from("regrade_requests")
      .update({
        status: params.status,
        resolved_by: userProfile.id,
        resolved_at: resolvedAt,
        resolution_notes: params.resolutionNotes.trim(),
        points_awarded: params.status === "approved" ? params.pointsAwarded : null,
      })
      .eq("id", params.requestId)
      .select()
      .single();

    if (updateError) {
      console.error("Error resolving regrade request:", updateError);
      return {
        success: false,
        error: "Failed to resolve regrade request",
      };
    }

    // If approved, recalculate grade and update gradebook
    if (params.status === "approved" && params.pointsAwarded !== undefined) {
      try {
        await recalculateGradeAfterRegrade(
          request.submission_id,
          request.rubric_score_id,
          request.rubric_item_id,
          params.pointsAwarded,
          userProfile.id,
          params.resolutionNotes,
          assignment.max_points
        );
      } catch (gradeError) {
        console.error("Error recalculating grade:", gradeError);
        // Log error but don't fail the resolution
        // The regrade request is marked as approved, but grade update failed
        return {
          success: true,
          request: updatedRequest,
          error: "Regrade approved but grade recalculation failed. Please update manually.",
        } as any;
      }
    }

    // Notify student about the resolution
    const { data: assignmentData } = await supabase
      .from("assignments")
      .select("title")
      .eq("id", request.assignment_id)
      .single();

    const rubricItemName = request.audit_metadata?.rubric_criterion_text || "Rubric Item";
    
    await notifyStudentAboutRegradeResolution(
      request.student_id,
      assignmentData?.title || "Assignment",
      rubricItemName,
      params.status,
      params.resolutionNotes,
      params.pointsAwarded,
      request.audit_metadata?.max_points,
      request.audit_metadata
    ).catch(err => console.error("Failed to send notification:", err));

    return {
      success: true,
      request: updatedRequest,
    };
  } catch (error) {
    console.error("Error in resolveRegradeRequest:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Recalculate grade after regrade approval
 * Updates rubric scores, submission grade, and creates audit log entry
 */
async function recalculateGradeAfterRegrade(
  submissionId: string,
  rubricScoreId: string,
  rubricItemId: string,
  newPoints: number,
  reviewerId: string,
  reason: string,
  totalPoints: number
): Promise<void> {
  const supabase = await createClient();

  // Get current rubric score
  const { data: rubricScore, error: scoreError } = await supabase
    .from("rubric_scores")
    .select("scores, ai_comments, graded_by, graded_at")
    .eq("id", rubricScoreId)
    .single();

  if (scoreError || !rubricScore) {
    throw new Error("Rubric score not found");
  }

  const scores = rubricScore.scores as any;
  const previousScore = scores[rubricItemId];

  // Update the rubric item score
  scores[rubricItemId] = newPoints;

  // Calculate new total score
  const newTotalScore = Object.values(scores).reduce(
    (sum: number, score: any) => sum + (typeof score === "number" ? score : 0),
    0
  );

  // Update rubric scores with TA override tracking
  const { error: updateScoreError } = await supabase
    .from("rubric_scores")
    .update({
      scores,
      updated_at: new Date().toISOString(),
    })
    .eq("id", rubricScoreId);

  if (updateScoreError) {
    throw new Error("Failed to update rubric scores");
  }

  // Update submission grade
  const { error: updateSubmissionError } = await supabase
    .from("submissions")
    .update({
      grade: newTotalScore,
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (updateSubmissionError) {
    throw new Error("Failed to update submission grade");
  }

  // Create immutable audit log entry
  const auditEntry = {
    submission_id: submissionId,
    rubric_score_id: rubricScoreId,
    rubric_item_id: rubricItemId,
    action: "regrade_approved",
    previous_score: previousScore,
    new_score: newPoints,
    changed_by: reviewerId,
    reason,
    timestamp: new Date().toISOString(),
    metadata: {
      previous_total: Object.values(rubricScore.scores as any).reduce(
        (sum: number, score: any) => sum + (typeof score === "number" ? score : 0),
        0
      ),
      new_total: newTotalScore,
      original_grader: rubricScore.graded_by,
      original_graded_at: rubricScore.graded_at,
    },
  };

  // Store audit entry (create table if needed)
  const { error: auditError } = await supabase
    .from("grade_audit_log")
    .insert(auditEntry);

  if (auditError) {
    console.error("Failed to create audit log entry:", auditError);
    // Don't throw - audit log is important but not critical for grade update
  }
}

/**
 * Get rubric items with scores for a submission (for regrade request form)
 */
export async function getRubricItemsForSubmission(
  submissionId: string
): Promise<{
  success: boolean;
  rubricScoreId?: string;
  items?: Array<{
    id: string;
    name: string;
    description: string;
    points: number;
    deduction?: number;
  }>;
  error?: string;
}> {
  try {
    const userProfile = await requireAuth();
    const supabase = await createClient();

    // Get submission and verify ownership
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, student_id, assignment_id")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      return { success: false, error: "Submission not found" };
    }

    if (submission.student_id !== userProfile.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get rubric for this assignment
    const { data: rubric, error: rubricError } = await supabase
      .from("rubrics")
      .select("id, criteria")
      .eq("assignment_id", submission.assignment_id)
      .single();

    if (rubricError || !rubric) {
      return { success: false, error: "Rubric not found for this assignment" };
    }

    // Get rubric scores for this submission
    const { data: rubricScore, error: scoreError } = await supabase
      .from("rubric_scores")
      .select("id, scores")
      .eq("submission_id", submissionId)
      .eq("rubric_id", rubric.id)
      .single();

    if (scoreError || !rubricScore) {
      return { success: false, error: "Rubric scores not found" };
    }

    // Parse criteria and scores
    const criteria = rubric.criteria as any[];
    const scores = rubricScore.scores as any;

    const items = criteria.map((criterion: any) => ({
      id: criterion.id,
      name: criterion.name || criterion.description?.substring(0, 50) || "Criterion",
      description: criterion.description || "",
      points: criterion.max_points || criterion.points || criterion.maxPoints || 0,
      deduction: scores[criterion.id] !== undefined 
        ? Math.max(0, (criterion.max_points || 0) - scores[criterion.id])
        : undefined,
    }));

    return {
      success: true,
      rubricScoreId: rubricScore.id,
      items,
    };
  } catch (error) {
    console.error("Error fetching rubric items:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get audit log entries for a submission
 * Returns immutable audit trail of all grade changes
 */
export async function getSubmissionAuditLog(
  submissionId: string
): Promise<{
  success: boolean;
  auditLog?: Array<{
    id: string;
    submission_id: string;
    rubric_score_id: string;
    rubric_item_id: string;
    action: string;
    previous_score: number;
    new_score: number;
    changed_by: string;
    reason: string;
    timestamp: string;
    metadata: any;
    reviewer?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  }>;
  error?: string;
}> {
  try {
    const userProfile = await requireAuth();
    const supabase = await createClient();

    // Verify user has access to this submission
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, student_id, assignment_id")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      return { success: false, error: "Submission not found" };
    }

    // Check if user is the student, instructor, or TA
    const isStudent = submission.student_id === userProfile.id;
    
    let hasAccess = isStudent;
    
    if (!hasAccess) {
      // Check if user is instructor or TA for this assignment's course
      const { data: assignment } = await supabase
        .from("assignments")
        .select("instructor_id, course_id")
        .eq("id", submission.assignment_id)
        .single();

      if (assignment) {
        const isInstructor = assignment.instructor_id === userProfile.id;
        
        if (!isInstructor) {
          const { data: taAssignment } = await supabase
            .from("course_ta_assignments")
            .select("id")
            .eq("course_id", assignment.course_id)
            .eq("ta_id", userProfile.id)
            .maybeSingle();
          
          hasAccess = !!taAssignment;
        } else {
          hasAccess = true;
        }
      }
    }

    if (!hasAccess) {
      return { success: false, error: "You do not have permission to view this audit log" };
    }

    // Fetch audit log entries
    const { data: auditLog, error: auditError } = await supabase
      .from("grade_audit_log")
      .select(`
        *,
        reviewer:changed_by (
          first_name,
          last_name,
          email
        )
      `)
      .eq("submission_id", submissionId)
      .order("timestamp", { ascending: false });

    if (auditError) {
      console.error("Error fetching audit log:", auditError);
      return { success: false, error: "Failed to fetch audit log" };
    }

    return {
      success: true,
      auditLog: auditLog || [],
    };
  } catch (error) {
    console.error("Error in getSubmissionAuditLog:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Notify TAs and instructor about new regrade request
 */
async function notifyTAsAboutRegradeRequest(
  assignmentId: string,
  studentName: string,
  assignmentTitle: string,
  rubricItemId: string
): Promise<void> {
  try {
    const supabase = await createClient();
    const { createNotificationService, NotificationEventType } = await import("@/services/notifications");

    // Get assignment and course info
    const { data: assignment } = await supabase
      .from("assignments")
      .select("instructor_id, course_id")
      .eq("id", assignmentId)
      .single();

    if (!assignment) return;

    const service = createNotificationService();

    // Send notification to instructor
    await service.handleEvent({
      type: NotificationEventType.REGRADE_REQUEST_SUBMITTED,
      userId: assignment.instructor_id,
      studentName,
      assignmentId,
      assignmentTitle,
      rubricItemId,
      timestamp: new Date().toISOString(),
    } as any);

    // Get all TAs for this course
    const { data: tas } = await supabase
      .from("course_ta_assignments")
      .select("ta_id")
      .eq("course_id", assignment.course_id);

    // Send notification to all TAs
    if (tas) {
      for (const ta of tas) {
        await service.handleEvent({
          type: NotificationEventType.REGRADE_REQUEST_SUBMITTED,
          userId: ta.ta_id,
          studentName,
          assignmentId,
          assignmentTitle,
          rubricItemId,
          timestamp: new Date().toISOString(),
        } as any);
      }
    }
  } catch (error) {
    console.error("Error notifying TAs about regrade request:", error);
    // Don't fail the request if notification fails
  }
}

/**
 * Notify student about regrade request resolution
 */
async function notifyStudentAboutRegradeResolution(
  studentId: string,
  assignmentTitle: string,
  rubricItemName: string,
  status: 'approved' | 'rejected',
  resolutionNotes: string,
  pointsAwarded?: number,
  maxPoints?: number,
  auditMetadata?: any
): Promise<void> {
  try {
    const { createNotificationService, NotificationEventType } = await import("@/services/notifications");
    const service = createNotificationService();

    await service.handleEvent({
      type: NotificationEventType.REGRADE_REQUEST_RESOLVED,
      studentId,
      assignmentTitle,
      rubricItemName,
      status,
      resolutionNotes,
      pointsAwarded,
      maxPoints,
      auditMetadata,
      timestamp: new Date().toISOString(),
    } as any);
  } catch (error) {
    console.error("Error notifying student about regrade resolution:", error);
    // Don't fail the resolution if notification fails
  }
}
