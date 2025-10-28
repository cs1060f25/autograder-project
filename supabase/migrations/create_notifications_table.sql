-- Create notifications table
-- This table stores all notification logs sent by the NotificationService

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('email', 'sms')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'mock')),
  message TEXT NOT NULL,
  error_message TEXT,
  metadata JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_event_type ON notifications(event_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only the Notification Service (via service role key) can insert logs
CREATE POLICY "Service role can insert notifications"
  ON notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- RLS Policy: Users can view only their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own notifications (for marking as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Stores all notification logs sent by the NotificationService';
COMMENT ON COLUMN notifications.id IS 'Unique identifier for the notification log';
COMMENT ON COLUMN notifications.user_id IS 'User who received the notification';
COMMENT ON COLUMN notifications.event_type IS 'Type of event that triggered the notification';
COMMENT ON COLUMN notifications.provider IS 'Provider used to send the notification (email, sms)';
COMMENT ON COLUMN notifications.status IS 'Status of the notification (pending, sent, failed, mock)';
COMMENT ON COLUMN notifications.message IS 'JSON string containing the notification message details';
COMMENT ON COLUMN notifications.error_message IS 'Error message if the notification failed';
COMMENT ON COLUMN notifications.metadata IS 'Additional metadata about the notification';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp when the notification was read by the user';
COMMENT ON COLUMN notifications.created_at IS 'Timestamp when the notification was created';
