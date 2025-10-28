-- Row Level Security (RLS) Policies
-- This migration sets up RLS policies for all tables based on user roles

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_ta_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user is instructor of a course
CREATE OR REPLACE FUNCTION public.is_course_instructor(course_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = course_uuid AND instructor_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user is TA for a course
CREATE OR REPLACE FUNCTION public.is_course_ta(course_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_ta_assignments
    WHERE course_id = course_uuid AND ta_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user is enrolled in a course
CREATE OR REPLACE FUNCTION public.is_enrolled_student(course_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE course_id = course_uuid AND student_id = auth.uid() AND status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Instructors can view all users (for adding TAs and students)
CREATE POLICY "Instructors can view all users"
  ON public.users FOR SELECT
  USING (get_user_role() = 'instructor');

-- TAs can view students in their courses
CREATE POLICY "TAs can view students in their courses"
  ON public.users FOR SELECT
  USING (
    get_user_role() = 'ta' AND
    EXISTS (
      SELECT 1 FROM public.course_ta_assignments cta
      JOIN public.course_enrollments ce ON ce.course_id = cta.course_id
      WHERE cta.ta_id = auth.uid() AND ce.student_id = public.users.id
    )
  );

-- Allow user creation (handled by Supabase Auth trigger)
CREATE POLICY "Allow user creation"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- COURSES TABLE POLICIES
-- ============================================================================

-- Instructors can view their own courses
CREATE POLICY "Instructors can view own courses"
  ON public.courses FOR SELECT
  USING (instructor_id = auth.uid());

-- Instructors can create courses
CREATE POLICY "Instructors can create courses"
  ON public.courses FOR INSERT
  WITH CHECK (
    get_user_role() = 'instructor' AND
    instructor_id = auth.uid()
  );

-- Instructors can update their own courses
CREATE POLICY "Instructors can update own courses"
  ON public.courses FOR UPDATE
  USING (instructor_id = auth.uid());

-- Instructors can delete their own courses
CREATE POLICY "Instructors can delete own courses"
  ON public.courses FOR DELETE
  USING (instructor_id = auth.uid());

-- TAs can view courses they're assigned to
CREATE POLICY "TAs can view assigned courses"
  ON public.courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_ta_assignments
      WHERE course_id = public.courses.id AND ta_id = auth.uid()
    )
  );

-- Students can view courses they're enrolled in
CREATE POLICY "Students can view enrolled courses"
  ON public.courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments
      WHERE course_id = public.courses.id AND student_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================================================
-- ASSIGNMENTS TABLE POLICIES
-- ============================================================================

-- Instructors can manage their own assignments
CREATE POLICY "Instructors can view own assignments"
  ON public.assignments FOR SELECT
  USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can create assignments"
  ON public.assignments FOR INSERT
  WITH CHECK (
    get_user_role() = 'instructor' AND
    instructor_id = auth.uid()
  );

CREATE POLICY "Instructors can update own assignments"
  ON public.assignments FOR UPDATE
  USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can delete own assignments"
  ON public.assignments FOR DELETE
  USING (instructor_id = auth.uid());

-- TAs can view published assignments in their courses
CREATE POLICY "TAs can view assignments in assigned courses"
  ON public.assignments FOR SELECT
  USING (
    status = 'published' AND
    EXISTS (
      SELECT 1 FROM public.course_ta_assignments
      WHERE course_id = public.assignments.course_id AND ta_id = auth.uid()
    )
  );

-- Students can view published assignments in enrolled courses
CREATE POLICY "Students can view published assignments"
  ON public.assignments FOR SELECT
  USING (
    status = 'published' AND
    EXISTS (
      SELECT 1 FROM public.course_enrollments
      WHERE course_id = public.assignments.course_id AND student_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================================================
-- RUBRICS TABLE POLICIES
-- ============================================================================

-- Instructors can manage rubrics for their assignments
CREATE POLICY "Instructors can view own rubrics"
  ON public.rubrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE id = public.rubrics.assignment_id AND instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can create rubrics"
  ON public.rubrics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE id = assignment_id AND instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can update own rubrics"
  ON public.rubrics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE id = public.rubrics.assignment_id AND instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can delete own rubrics"
  ON public.rubrics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE id = public.rubrics.assignment_id AND instructor_id = auth.uid()
    )
  );

-- TAs can view rubrics for assignments in their courses
CREATE POLICY "TAs can view rubrics"
  ON public.rubrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.course_ta_assignments cta ON cta.course_id = a.course_id
      WHERE a.id = public.rubrics.assignment_id AND cta.ta_id = auth.uid()
    )
  );

-- ============================================================================
-- SUBMISSIONS TABLE POLICIES
-- ============================================================================

-- Students can view and manage their own submissions
CREATE POLICY "Students can view own submissions"
  ON public.submissions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can create own submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own submissions"
  ON public.submissions FOR UPDATE
  USING (student_id = auth.uid() AND status IN ('draft', 'submitted'));

-- Instructors can view all submissions for their assignments
CREATE POLICY "Instructors can view submissions for own assignments"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE id = public.submissions.assignment_id AND instructor_id = auth.uid()
    )
  );

-- Instructors can grade submissions
CREATE POLICY "Instructors can update submissions for grading"
  ON public.submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE id = public.submissions.assignment_id AND instructor_id = auth.uid()
    )
  );

-- TAs can view submissions in their assigned courses
CREATE POLICY "TAs can view submissions in assigned courses"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.course_ta_assignments cta ON cta.course_id = a.course_id
      WHERE a.id = public.submissions.assignment_id AND cta.ta_id = auth.uid()
    )
  );

-- TAs can grade submissions
CREATE POLICY "TAs can update submissions for grading"
  ON public.submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.course_ta_assignments cta ON cta.course_id = a.course_id
      WHERE a.id = public.submissions.assignment_id AND cta.ta_id = auth.uid()
    )
  );

-- ============================================================================
-- RUBRIC SCORES TABLE POLICIES
-- ============================================================================

-- Students can view their own rubric scores
CREATE POLICY "Students can view own rubric scores"
  ON public.rubric_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions
      WHERE id = public.rubric_scores.submission_id AND student_id = auth.uid()
    )
  );

-- Instructors can manage rubric scores for their assignments
CREATE POLICY "Instructors can view rubric scores"
  ON public.rubric_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      WHERE s.id = public.rubric_scores.submission_id AND a.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can create rubric scores"
  ON public.rubric_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      WHERE s.id = submission_id AND a.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can update rubric scores"
  ON public.rubric_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      WHERE s.id = public.rubric_scores.submission_id AND a.instructor_id = auth.uid()
    )
  );

-- TAs can manage rubric scores
CREATE POLICY "TAs can view rubric scores"
  ON public.rubric_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      JOIN public.course_ta_assignments cta ON cta.course_id = a.course_id
      WHERE s.id = public.rubric_scores.submission_id AND cta.ta_id = auth.uid()
    )
  );

CREATE POLICY "TAs can create rubric scores"
  ON public.rubric_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      JOIN public.course_ta_assignments cta ON cta.course_id = a.course_id
      WHERE s.id = submission_id AND cta.ta_id = auth.uid()
    )
  );

CREATE POLICY "TAs can update rubric scores"
  ON public.rubric_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      JOIN public.course_ta_assignments cta ON cta.course_id = a.course_id
      WHERE s.id = public.rubric_scores.submission_id AND cta.ta_id = auth.uid()
    )
  );

-- ============================================================================
-- COURSE ENROLLMENTS TABLE POLICIES
-- ============================================================================

-- Instructors can manage enrollments for their courses
CREATE POLICY "Instructors can view enrollments for own courses"
  ON public.course_enrollments FOR SELECT
  USING (is_course_instructor(course_id));

CREATE POLICY "Instructors can create enrollments"
  ON public.course_enrollments FOR INSERT
  WITH CHECK (is_course_instructor(course_id));

CREATE POLICY "Instructors can update enrollments"
  ON public.course_enrollments FOR UPDATE
  USING (is_course_instructor(course_id));

CREATE POLICY "Instructors can delete enrollments"
  ON public.course_enrollments FOR DELETE
  USING (is_course_instructor(course_id));

-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
  ON public.course_enrollments FOR SELECT
  USING (student_id = auth.uid());

-- TAs can view enrollments for their courses
CREATE POLICY "TAs can view enrollments for assigned courses"
  ON public.course_enrollments FOR SELECT
  USING (is_course_ta(course_id));

-- ============================================================================
-- COURSE TA ASSIGNMENTS TABLE POLICIES
-- ============================================================================

-- Instructors can manage TA assignments for their courses
CREATE POLICY "Instructors can view TA assignments for own courses"
  ON public.course_ta_assignments FOR SELECT
  USING (is_course_instructor(course_id));

CREATE POLICY "Instructors can create TA assignments"
  ON public.course_ta_assignments FOR INSERT
  WITH CHECK (is_course_instructor(course_id));

CREATE POLICY "Instructors can delete TA assignments"
  ON public.course_ta_assignments FOR DELETE
  USING (is_course_instructor(course_id));

-- TAs can view their own assignments
CREATE POLICY "TAs can view own assignments"
  ON public.course_ta_assignments FOR SELECT
  USING (ta_id = auth.uid());
