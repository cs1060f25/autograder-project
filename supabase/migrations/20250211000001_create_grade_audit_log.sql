-- Create grade_audit_log table for immutable audit trail
-- This table stores all grade changes including TA overrides and regrade approvals

CREATE TABLE IF NOT EXISTS grade_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  rubric_score_id UUID NOT NULL REFERENCES rubric_scores(id) ON DELETE CASCADE,
  rubric_item_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('regrade_approved', 'ta_override', 'grade_updated', 'manual_adjustment')),
  previous_score NUMERIC NOT NULL,
  new_score NUMERIC NOT NULL,
  changed_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_grade_audit_log_submission ON grade_audit_log(submission_id);
CREATE INDEX idx_grade_audit_log_rubric_score ON grade_audit_log(rubric_score_id);
CREATE INDEX idx_grade_audit_log_changed_by ON grade_audit_log(changed_by);
CREATE INDEX idx_grade_audit_log_timestamp ON grade_audit_log(timestamp DESC);

-- Add comment to table
COMMENT ON TABLE grade_audit_log IS 'Immutable audit trail of all grade changes and overrides';
COMMENT ON COLUMN grade_audit_log.action IS 'Type of grade change: regrade_approved, ta_override, grade_updated, manual_adjustment';
COMMENT ON COLUMN grade_audit_log.metadata IS 'Additional context about the grade change (original grader, totals, etc.)';

-- Enable Row Level Security
ALTER TABLE grade_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view audit logs for their own submissions
CREATE POLICY "Students can view their own audit logs"
  ON grade_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE submissions.id = grade_audit_log.submission_id
        AND submissions.student_id = auth.uid()
    )
  );

-- Policy: Instructors can view audit logs for their courses
CREATE POLICY "Instructors can view audit logs for their courses"
  ON grade_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM submissions
      JOIN assignments ON assignments.id = submissions.assignment_id
      WHERE submissions.id = grade_audit_log.submission_id
        AND assignments.instructor_id = auth.uid()
    )
  );

-- Policy: TAs can view audit logs for courses they teach
CREATE POLICY "TAs can view audit logs for their courses"
  ON grade_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM submissions
      JOIN assignments ON assignments.id = submissions.assignment_id
      JOIN course_ta_assignments ON course_ta_assignments.course_id = assignments.course_id
      WHERE submissions.id = grade_audit_log.submission_id
        AND course_ta_assignments.ta_id = auth.uid()
    )
  );

-- Policy: Only instructors and TAs can insert audit log entries (via service role)
-- Note: In practice, inserts will be done via server-side functions with proper authorization
CREATE POLICY "Service role can insert audit logs"
  ON grade_audit_log
  FOR INSERT
  WITH CHECK (true);  -- Service role bypasses RLS, but we keep this for explicit documentation

-- IMPORTANT: Prevent updates and deletes to maintain immutability
-- No UPDATE or DELETE policies are created, making the audit log immutable
-- Even service role cannot update or delete entries once created

-- Add trigger to prevent updates
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log entries are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_log_update
  BEFORE UPDATE ON grade_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER prevent_audit_log_delete
  BEFORE DELETE ON grade_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();

-- Grant necessary permissions
GRANT SELECT ON grade_audit_log TO authenticated;
GRANT INSERT ON grade_audit_log TO service_role;
