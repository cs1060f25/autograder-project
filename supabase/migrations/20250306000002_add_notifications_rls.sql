-- Add Row Level Security (RLS) policies for notifications table
-- Ensures users can only view their own notifications

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- Policy: Service role can insert notifications (for system-generated notifications)
-- Note: This policy allows the notification service to insert notifications for any user
CREATE POLICY "Service role can insert notifications"
ON notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- Add comments explaining the policies
COMMENT ON POLICY "Users can view own notifications" ON notifications IS 
'Users can only view their own notifications. This ensures notification privacy.';

COMMENT ON POLICY "Users can update own notifications" ON notifications IS 
'Users can update their own notifications, primarily to mark them as read.';

COMMENT ON POLICY "Service role can insert notifications" ON notifications IS 
'The notification service (using service role) can insert notifications for any user.';
