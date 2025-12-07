-- Mock Regrade Request Creation Script
-- Run this in Supabase SQL Editor to create a test regrade request

-- Step 1: Find a graded submission (this will show you what's available)
SELECT 
  s.id as submission_id,
  s.student_id,
  s.assignment_id,
  a.title as assignment_title,
  u.first_name || ' ' || u.last_name as student_name,
  s.grade,
  rs.id as rubric_score_id,
  rs.scores
FROM submissions s
JOIN assignments a ON a.id = s.assignment_id
JOIN users u ON u.id = s.student_id
LEFT JOIN rubric_scores rs ON rs.submission_id = s.id
WHERE s.status = 'graded'
  AND rs.id IS NOT NULL
LIMIT 5;

-- Step 2: Create a mock regrade request using the first available graded submission
-- This will automatically use the first graded submission it finds
INSERT INTO regrade_requests (
  submission_id,
  student_id,
  assignment_id,
  rubric_score_id,
  rubric_item_id,
  student_explanation,
  status,
  audit_metadata,
  created_at,
  updated_at
)
SELECT 
  s.id,
  s.student_id,
  s.assignment_id,
  rs.id,
  'criterion_1', -- You may need to adjust this to match actual rubric item IDs
  'I believe my implementation was correct. The code properly handles all edge cases as specified in the requirements. The deduction appears to be based on a misunderstanding of the problem statement. Could you please review this again?',
  'pending',
  jsonb_build_object(
    'rubric_rule_id', 'criterion_1',
    'original_deduction', 5,
    'max_points', 10,
    'ai_rationale', 'Code does not handle null input case properly',
    'rubric_criterion_text', 'Proper error handling and edge cases',
    'ta_override_history', '[]'::jsonb
  ),
  now(),
  now()
FROM submissions s
JOIN rubric_scores rs ON rs.submission_id = s.id
WHERE s.status = 'graded'
LIMIT 1;

-- Step 3: Verify the regrade request was created
SELECT 
  rr.id,
  rr.status,
  u.first_name || ' ' || u.last_name as student_name,
  u.email as student_email,
  a.title as assignment_title,
  rr.student_explanation,
  rr.audit_metadata,
  rr.created_at
FROM regrade_requests rr
JOIN users u ON u.id = rr.student_id
JOIN assignments a ON a.id = rr.assignment_id
ORDER BY rr.created_at DESC
LIMIT 1;

-- Step 4: Get the student and TA/instructor info for testing
SELECT 
  'STUDENT LOGIN' as account_type,
  u.email,
  u.first_name || ' ' || u.last_name as name,
  u.role
FROM regrade_requests rr
JOIN users u ON u.id = rr.student_id
ORDER BY rr.created_at DESC
LIMIT 1

UNION ALL

SELECT 
  'INSTRUCTOR LOGIN' as account_type,
  u.email,
  u.first_name || ' ' || u.last_name as name,
  u.role
FROM regrade_requests rr
JOIN assignments a ON a.id = rr.assignment_id
JOIN users u ON u.id = a.instructor_id
ORDER BY rr.created_at DESC
LIMIT 1;
