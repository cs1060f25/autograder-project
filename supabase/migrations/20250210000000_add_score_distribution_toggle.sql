-- Add show_score_distribution column to assignments table
-- This allows instructors to toggle whether students can see score distribution data

ALTER TABLE public.assignments
ADD COLUMN show_score_distribution BOOLEAN NOT NULL DEFAULT false;

-- Add index for faster queries when filtering by this field
CREATE INDEX idx_assignments_show_score_distribution ON public.assignments(show_score_distribution);

-- Add comment to document the column
COMMENT ON COLUMN public.assignments.show_score_distribution IS 'When true, students can view score distribution statistics for this assignment';
