/**
 * Regrade Request Types
 * Types for student regrade request functionality
 */

export type RegradeRequestStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

/**
 * Audit metadata captured at request submission time
 * This data is immutable and provides context for the regrade request
 */
export interface RegradeAuditMetadata {
  ai_rationale?: string;
  rubric_rule_id: string;
  original_deduction: number;
  ta_override_history?: Array<{
    overridden_by: string;
    overridden_at: string;
    previous_score: number;
    new_score: number;
    reason?: string;
  }>;
  ai_grade_data?: any;
  rubric_criterion_text?: string;
  max_points?: number;
}

/**
 * Regrade request database record
 */
export interface RegradeRequest {
  id: string;
  submission_id: string;
  student_id: string;
  assignment_id: string;
  rubric_score_id: string;
  rubric_item_id: string;
  student_explanation: string;
  status: RegradeRequestStatus;
  audit_metadata: RegradeAuditMetadata;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  points_awarded?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Parameters for creating a new regrade request
 */
export interface CreateRegradeRequestParams {
  submissionId: string;
  assignmentId: string;
  rubricScoreId: string;
  rubricItemId: string;
  studentExplanation: string;
}

/**
 * Parameters for resolving a regrade request
 */
export interface ResolveRegradeRequestParams {
  requestId: string;
  status: 'approved' | 'rejected';
  resolutionNotes: string;
  pointsAwarded?: number;
}

/**
 * Response type for regrade request operations
 */
export interface RegradeRequestResponse {
  success: boolean;
  request?: RegradeRequest;
  error?: string;
}

/**
 * Response type for listing regrade requests
 */
export interface RegradeRequestListResponse {
  success: boolean;
  requests?: RegradeRequest[];
  error?: string;
}
