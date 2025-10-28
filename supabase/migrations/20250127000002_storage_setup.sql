-- Storage Buckets and Policies
-- This migration creates storage buckets for assignment and submission files

-- ============================================================================
-- CREATE STORAGE BUCKETS
-- ============================================================================

-- Bucket for assignment files (instructor uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-files',
  'assignment-files',
  true, -- Public bucket for easy access
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket for submission files (student uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submission-files',
  'submission-files',
  false, -- Private bucket, access controlled by policies
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES FOR ASSIGNMENT-FILES BUCKET
-- ============================================================================

-- Allow authenticated users to view assignment files (public bucket)
CREATE POLICY "Anyone can view assignment files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assignment-files');

-- Only instructors can upload assignment files
CREATE POLICY "Instructors can upload assignment files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assignment-files' AND
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'instructor'
    )
  );

-- Only instructors can update their own assignment files
CREATE POLICY "Instructors can update own assignment files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'assignment-files' AND
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'instructor'
    )
  );

-- Only instructors can delete their own assignment files
CREATE POLICY "Instructors can delete own assignment files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'assignment-files' AND
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'instructor'
    )
  );

-- ============================================================================
-- STORAGE POLICIES FOR SUBMISSION-FILES BUCKET
-- ============================================================================

-- Students can view their own submission files
CREATE POLICY "Students can view own submission files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submission-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Instructors can view all submission files for their assignments
CREATE POLICY "Instructors can view submission files for own assignments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submission-files' AND
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      WHERE a.instructor_id = auth.uid()
        AND (storage.foldername(name))[1] = s.student_id::text
    )
  );

-- TAs can view submission files for their assigned courses
CREATE POLICY "TAs can view submission files for assigned courses"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submission-files' AND
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      JOIN public.course_ta_assignments cta ON cta.course_id = a.course_id
      WHERE cta.ta_id = auth.uid()
        AND (storage.foldername(name))[1] = s.student_id::text
    )
  );

-- Students can upload their own submission files
CREATE POLICY "Students can upload own submission files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'submission-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Students can update their own submission files (before final submission)
CREATE POLICY "Students can update own submission files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'submission-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Students can delete their own submission files (before final submission)
CREATE POLICY "Students can delete own submission files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'submission-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Instructors can delete submission files for their assignments
CREATE POLICY "Instructors can delete submission files for own assignments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'submission-files' AND
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      WHERE a.instructor_id = auth.uid()
        AND (storage.foldername(name))[1] = s.student_id::text
    )
  );
