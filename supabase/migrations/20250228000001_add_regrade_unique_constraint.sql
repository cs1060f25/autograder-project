-- Add unique constraint to prevent duplicate pending regrade requests
-- This prevents race conditions where multiple requests for the same rubric item
-- could be created simultaneously

-- Create a unique partial index on pending requests only
-- This allows multiple resolved requests but only one pending request per rubric item
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_regrade_request 
ON regrade_requests (submission_id, rubric_item_id) 
WHERE status = 'pending';

-- Add comment explaining the constraint
COMMENT ON INDEX unique_pending_regrade_request IS 
'Ensures only one pending regrade request exists per submission and rubric item. Prevents race conditions during concurrent request submissions.';
