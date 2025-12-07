-- Add Row Level Security (RLS) policies for regrade_requests table
-- Ensures students can only view their own regrade requests
-- Instructors and TAs can view requests for their courses

-- Enable RLS on regrade_requests table
ALTER TABLE regrade_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own regrade requests
CREATE POLICY "Students can view own regrade requests"
ON regrade_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = student_id
);

-- Policy: Students can insert their own regrade requests
CREATE POLICY "Students can create own regrade requests"
ON regrade_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = student_id
);

-- Policy: Students can update (withdraw) their own pending regrade requests
CREATE POLICY "Students can update own pending regrade requests"
ON regrade_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = student_id
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() = student_id
  AND status IN ('pending', 'withdrawn')
);

-- Policy: Instructors can view regrade requests for their assignments
CREATE POLICY "Instructors can view regrade requests for their assignments"
ON regrade_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignments
    WHERE assignments.id = regrade_requests.assignment_id
    AND assignments.instructor_id = auth.uid()
  )
);

-- Policy: TAs can view regrade requests for their courses
CREATE POLICY "TAs can view regrade requests for their courses"
ON regrade_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignments
    JOIN course_ta_assignments ON course_ta_assignments.course_id = assignments.course_id
    WHERE assignments.id = regrade_requests.assignment_id
    AND course_ta_assignments.ta_id = auth.uid()
  )
);

-- Policy: Instructors can resolve regrade requests for their assignments
CREATE POLICY "Instructors can resolve regrade requests for their assignments"
ON regrade_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignments
    WHERE assignments.id = regrade_requests.assignment_id
    AND assignments.instructor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM assignments
    WHERE assignments.id = regrade_requests.assignment_id
    AND assignments.instructor_id = auth.uid()
  )
);

-- Policy: TAs can resolve regrade requests for their courses
CREATE POLICY "TAs can resolve regrade requests for their courses"
ON regrade_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignments
    JOIN course_ta_assignments ON course_ta_assignments.course_id = assignments.course_id
    WHERE assignments.id = regrade_requests.assignment_id
    AND course_ta_assignments.ta_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM assignments
    JOIN course_ta_assignments ON course_ta_assignments.course_id = assignments.course_id
    WHERE assignments.id = regrade_requests.assignment_id
    AND course_ta_assignments.ta_id = auth.uid()
  )
);

-- Add comments explaining the policies
COMMENT ON POLICY "Students can view own regrade requests" ON regrade_requests IS 
'Students can only view their own regrade requests. This prevents students from viewing other students'' regrade information.';

COMMENT ON POLICY "Instructors can view regrade requests for their assignments" ON regrade_requests IS 
'Instructors can view all regrade requests for assignments they created.';

COMMENT ON POLICY "TAs can view regrade requests for their courses" ON regrade_requests IS 
'TAs can view regrade requests for courses they are assigned to.';

COMMENT ON POLICY "Instructors can resolve regrade requests for their assignments" ON regrade_requests IS 
'Instructors can approve or reject regrade requests for their assignments.';

COMMENT ON POLICY "TAs can resolve regrade requests for their courses" ON regrade_requests IS 
'TAs can approve or reject regrade requests for courses they are assigned to.';
