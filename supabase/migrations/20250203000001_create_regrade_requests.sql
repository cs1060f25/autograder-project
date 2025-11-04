-- Create regrade_requests table
-- Allows students to request regrade for specific rubric item deductions

CREATE TABLE IF NOT EXISTS public.regrade_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Core references
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  rubric_score_id UUID NOT NULL REFERENCES public.rubric_scores(id) ON DELETE CASCADE,
  
  -- Rubric item identification
  rubric_item_id TEXT NOT NULL, -- ID of the specific rubric criterion being contested
  
  -- Request details
  student_explanation TEXT NOT NULL CHECK (length(student_explanation) > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  
  -- Immutable audit metadata (captured at request time)
  audit_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Expected structure:
  -- {
  --   "ai_rationale": "...",
  --   "rubric_rule_id": "...",
  --   "original_deduction": 5.0,
  --   "ta_override_history": [...],
  --   "ai_grade_data": {...}
  -- }
  
  -- Resolution details (filled when request is resolved)
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  points_awarded NUMERIC(5,2), -- Points given back if approved
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  -- Only one active request per rubric item per submission
  CONSTRAINT unique_active_regrade_per_item 
    UNIQUE (submission_id, rubric_item_id, status) 
    WHERE status = 'pending'
);

-- Indexes for performance
CREATE INDEX idx_regrade_requests_submission ON public.regrade_requests(submission_id);
CREATE INDEX idx_regrade_requests_student ON public.regrade_requests(student_id);
CREATE INDEX idx_regrade_requests_assignment ON public.regrade_requests(assignment_id);
CREATE INDEX idx_regrade_requests_status ON public.regrade_requests(status);
CREATE INDEX idx_regrade_requests_created_at ON public.regrade_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.regrade_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Students can view only their own regrade requests
CREATE POLICY "Students can view their own regrade requests"
  ON public.regrade_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

-- RLS Policy: Students can insert their own regrade requests
CREATE POLICY "Students can create their own regrade requests"
  ON public.regrade_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

-- RLS Policy: Students can withdraw their own pending requests
CREATE POLICY "Students can withdraw their own pending requests"
  ON public.regrade_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id AND status = 'pending')
  WITH CHECK (auth.uid() = student_id AND status IN ('pending', 'withdrawn'));

-- RLS Policy: Instructors and TAs can view all regrade requests for their courses
CREATE POLICY "Instructors and TAs can view course regrade requests"
  ON public.regrade_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = regrade_requests.assignment_id
      AND (
        a.instructor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.course_ta_assignments cta
          WHERE cta.course_id = a.course_id
          AND cta.ta_id = auth.uid()
        )
      )
    )
  );

-- RLS Policy: Instructors and TAs can resolve regrade requests
CREATE POLICY "Instructors and TAs can resolve regrade requests"
  ON public.regrade_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = regrade_requests.assignment_id
      AND (
        a.instructor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.course_ta_assignments cta
          WHERE cta.course_id = a.course_id
          AND cta.ta_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = regrade_requests.assignment_id
      AND (
        a.instructor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.course_ta_assignments cta
          WHERE cta.course_id = a.course_id
          AND cta.ta_id = auth.uid()
        )
      )
    )
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_regrade_requests_updated_at 
  BEFORE UPDATE ON public.regrade_requests
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.regrade_requests IS 'Stores student regrade requests for specific rubric item deductions';
COMMENT ON COLUMN public.regrade_requests.rubric_item_id IS 'ID of the specific rubric criterion being contested';
COMMENT ON COLUMN public.regrade_requests.audit_metadata IS 'Immutable snapshot of AI rationale, rubric rules, and TA override history at request time';
COMMENT ON COLUMN public.regrade_requests.status IS 'Request status: pending, approved, rejected, or withdrawn';
COMMENT ON COLUMN public.regrade_requests.student_explanation IS 'Student explanation for why they believe the deduction was incorrect';
