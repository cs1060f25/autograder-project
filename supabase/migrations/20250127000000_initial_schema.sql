-- Initial Schema Migration for Autograder Project
-- This migration creates all necessary tables for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Note: Supabase Auth handles the auth.users table
-- We create a public.users table for additional profile information
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('instructor', 'ta', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster role-based queries
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);

-- ============================================================================
-- COURSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  instructor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  semester TEXT,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code, semester, year)
);

-- Indexes for faster queries
CREATE INDEX idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX idx_courses_code ON public.courses(code);

-- ============================================================================
-- ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  due_date TIMESTAMPTZ NOT NULL,
  max_points NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  assignment_type TEXT NOT NULL DEFAULT 'homework',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  instructions TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_assignments_course ON public.assignments(course_id);
CREATE INDEX idx_assignments_instructor ON public.assignments(instructor_id);
CREATE INDEX idx_assignments_status ON public.assignments(status);
CREATE INDEX idx_assignments_due_date ON public.assignments(due_date);

-- ============================================================================
-- RUBRICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rubrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id)
);

-- Index
CREATE INDEX idx_rubrics_assignment ON public.rubrics(assignment_id);

-- ============================================================================
-- SUBMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded')),
  grade NUMERIC(5,2),
  feedback TEXT,
  graded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  graded_at TIMESTAMPTZ,
  ai_grade_data JSONB,
  ai_graded_at TIMESTAMPTZ,
  ai_grade_status TEXT CHECK (ai_grade_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- Indexes
CREATE INDEX idx_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX idx_submissions_student ON public.submissions(student_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE INDEX idx_submissions_graded_by ON public.submissions(graded_by);

-- ============================================================================
-- RUBRIC SCORES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rubric_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  rubric_id UUID NOT NULL REFERENCES public.rubrics(id) ON DELETE CASCADE,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  ai_comments JSONB,
  graded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  graded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, rubric_id)
);

-- Indexes
CREATE INDEX idx_rubric_scores_submission ON public.rubric_scores(submission_id);
CREATE INDEX idx_rubric_scores_rubric ON public.rubric_scores(rubric_id);

-- ============================================================================
-- COURSE ENROLLMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

-- Indexes
CREATE INDEX idx_enrollments_course ON public.course_enrollments(course_id);
CREATE INDEX idx_enrollments_student ON public.course_enrollments(student_id);
CREATE INDEX idx_enrollments_status ON public.course_enrollments(status);

-- ============================================================================
-- COURSE TA ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.course_ta_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  ta_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, ta_id)
);

-- Indexes
CREATE INDEX idx_ta_assignments_course ON public.course_ta_assignments(course_id);
CREATE INDEX idx_ta_assignments_ta ON public.course_ta_assignments(ta_id);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rubrics_updated_at BEFORE UPDATE ON public.rubrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rubric_scores_updated_at BEFORE UPDATE ON public.rubric_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON public.course_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ta_assignments_updated_at BEFORE UPDATE ON public.course_ta_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
