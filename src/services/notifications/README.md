# Notification Service

A comprehensive notification system for the AI Grading Platform that sends email and SMS notifications to users when important events occur.

## Features

- ✅ **Email notifications** via SendGrid
- ✅ **SMS notifications** via Twilio
- ✅ **Mock mode** for development/testing
- ✅ **Database logging** with Row Level Security
- ✅ **Real-time notification widget** in dashboard
- ✅ **Full notification history page**
- ✅ **Automatic triggers** on grading events
- ✅ **Mark as read** functionality
- ✅ **Unread count badge**

## Architecture

```
Event (Grading/Document) → NotificationService
    ↓
Fetch User Contact Info (Database)
    ↓
Generate Messages (Email/SMS)
    ↓
Send via Providers (SendGrid/Twilio/Mock)
    ↓
Log to Database (notifications table)
    ↓
Display in UI (Bell widget + Notifications page)
```

## Setup

### 1. Database Migration

Run the SQL migration to create the notifications table:

```sql
-- File: supabase/migrations/create_notifications_table.sql
```

Go to Supabase Dashboard → SQL Editor and run the migration.

### 2. Environment Variables

Add to `.env.local`:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Mock Mode (default: true in development)
NOTIFICATION_MOCK_MODE=true

# Optional: For real email/SMS (production)
SENDGRID_API_KEY=SG.your-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Integration

Notifications are automatically sent when:

- **Submission is graded** - Student receives email/SMS with grade
- More events can be added as needed

## Usage

### Sending Notifications

```typescript
import { notifySubmissionGraded } from "@/lib/notification-actions";

await notifySubmissionGraded({
  submissionId: "sub-123",
  studentId: "user-456",
  assignmentId: "assign-789",
  grade: 95,
  feedback: "Great work!",
  gradedBy: "instructor-id",
});
```

### UI Components

**Notification Bell** - Shows in dashboard header with unread count
**Notifications Page** - Full history at `/dashboard/notifications`

## Event Types

- `submission_graded` - When a submission is graded
- `grade_updated` - When a grade is changed
- `feedback_available` - When new feedback is added
- `document_uploaded` - When a document is uploaded
- `document_processed` - When document processing completes
- `document_failed` - When document processing fails
- `assignment_published` - When a new assignment is published
- `assignment_due_soon` - Reminder for upcoming deadlines
- `assignment_overdue` - Alert for overdue assignments

## Providers

### MockProvider
- Used in development
- Logs to console instead of sending
- Always available

### SendGridProvider
- Sends HTML emails
- Requires API key
- Production-ready

### TwilioProvider
- Sends SMS messages
- Requires Account SID and Auth Token
- Production-ready

## Database Schema

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'email' or 'sms'
  status TEXT NOT NULL,   -- 'pending', 'sent', 'failed', 'mock'
  message TEXT NOT NULL,
  error_message TEXT,
  metadata JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Testing

Mock mode is enabled by default in development. Notifications will:
- ✅ Log to console
- ✅ Save to database
- ✅ Show in UI
- ❌ NOT send real emails/SMS

## Production

To enable real notifications:

1. Set `NOTIFICATION_MOCK_MODE=false`
2. Add SendGrid and/or Twilio credentials
3. Restart the application

## Security

- ✅ Row Level Security (RLS) on notifications table
- ✅ Users can only view their own notifications
- ✅ Only service role can insert notifications
- ✅ Service key stored securely in environment variables

## Future Enhancements

- [ ] In-app notification preferences
- [ ] Email templates with branding
- [ ] Notification scheduling
- [ ] Batch notifications
- [ ] Push notifications
- [ ] Slack/Discord integrations
