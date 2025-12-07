# Testing Regrade Request Notifications Locally

## 🚀 Server is Running!
- **Local URL**: http://localhost:3001
- **Status**: ✅ Ready

## 📋 Prerequisites

Your `.env.local` file should have these variables set:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key
- `SUPABASE_SERVICE_KEY` - Supabase service role key (for notifications)
- `SENDGRID_API_KEY` - (Optional) For email notifications
- `TWILIO_ACCOUNT_SID` - (Optional) For SMS notifications
- `TWILIO_AUTH_TOKEN` - (Optional) For SMS notifications
- `TWILIO_PHONE_NUMBER` - (Optional) For SMS notifications

**Note**: Notifications will run in **mock mode** if SendGrid/Twilio credentials are not provided.

## 🗄️ Database Setup

### Apply New RLS Policies

You need to apply the new RLS policies for regrade requests and notifications. You have two options:

#### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following migrations in order:

**Migration 1: Regrade Requests RLS**
```sql
-- Copy contents from: supabase/migrations/20250306000001_add_regrade_requests_rls.sql
```

**Migration 2: Notifications RLS**
```sql
-- Copy contents from: supabase/migrations/20250306000002_add_notifications_rls.sql
```

#### Option 2: Using Supabase CLI
If you have Supabase CLI installed:
```bash
supabase db push
```

## 🧪 Testing the Notification Feature

### Step 1: Create Test Accounts
You need three accounts to test the full flow:
1. **Instructor** - Creates courses and assignments
2. **TA** - Grades submissions and resolves regrade requests
3. **Student** - Submits work and requests regrades

### Step 2: Set Up Test Data
1. **As Instructor**:
   - Create a course
   - Create an assignment with a rubric
   - Add the TA to the course
   - Enroll the student in the course

2. **As Student**:
   - Submit the assignment
   
3. **As TA/Instructor**:
   - Grade the student's submission (deduct some points)

### Step 3: Test Regrade Request Flow

#### A. Submit Regrade Request (Student)
1. Log in as the **student**
2. Navigate to your graded submission
3. Click "Request Regrade" on a rubric item with deductions
4. Fill out the explanation form
5. Submit the request
6. ✅ **Verify**: Request appears with "Pending" status

#### B. Resolve Regrade Request (TA/Instructor)
1. Log in as **TA** or **Instructor**
2. Navigate to **Dashboard** → **Regrade Requests**
3. Click on the pending request to review
4. Choose to **Approve** or **Deny**:
   - **If Approving**: Enter points to award and resolution notes
   - **If Denying**: Enter resolution notes explaining why
5. Submit the resolution

#### C. Verify Notification (Student)
1. **Check Email** (if SendGrid configured):
   - Student should receive an email with:
     - ✅ Assignment name
     - ✅ Rubric item name
     - ✅ Decision (Approved/Denied)
     - ✅ TA/Instructor comment
     - ✅ Points awarded (if approved)
     - ✅ Original AI grading context
     - ✅ Link to view updated grade

2. **Check SMS** (if Twilio configured):
   - Student should receive a text message with status

3. **Check Database**:
   - Open Supabase dashboard → Table Editor → `notifications`
   - Verify notification was logged with:
     - `event_type`: "regrade_request_resolved"
     - `status`: "sent" or "mock"
     - `user_id`: Student's ID

#### D. Verify Student UI
1. Log in as **student**
2. Navigate to your regrade requests
3. Click on the resolved request
4. **Verify the modal shows**:
   - ✅ Status badge (green for approved, red for denied)
   - ✅ Resolution message
   - ✅ Resolution timestamp
   - ✅ Points awarded (if approved) - prominently displayed
   - ✅ TA/Instructor comment
   - ✅ Original AI grading context (if available)
   - ✅ Your original explanation

#### E. Verify Grade Update (If Approved)
1. Navigate to the assignment submission
2. **Verify**:
   - ✅ Grade has been updated
   - ✅ Rubric item score reflects new points
   - ✅ Total score is recalculated

## 🔒 Testing Security (RLS Policies)

### Test 1: Student Cannot View Other Students' Requests
1. Create two student accounts
2. Have Student A submit a regrade request
3. Log in as Student B
4. Try to access Student A's regrade request
5. ✅ **Expected**: Access denied or request not visible

### Test 2: Student Cannot View Other Students' Notifications
1. Log in as Student A
2. Check notifications table (via API or dashboard)
3. ✅ **Expected**: Only see your own notifications

### Test 3: TA Can View Requests for Their Courses
1. Log in as TA
2. Navigate to regrade requests
3. ✅ **Expected**: See all requests for courses you TA

### Test 4: Instructor Can View All Course Requests
1. Log in as Instructor
2. Navigate to regrade requests
3. ✅ **Expected**: See all requests for your courses

## 🐛 Troubleshooting

### Notifications Not Sending
- **Check**: Are SendGrid/Twilio credentials set in `.env.local`?
- **Solution**: If not set, notifications run in mock mode (logged but not sent)
- **Verify**: Check `notifications` table - status should be "mock" or "sent"

### RLS Policy Errors
- **Error**: "Row level security policy violation"
- **Solution**: Make sure you applied both RLS migration files
- **Verify**: In Supabase dashboard → Database → Policies, check that policies exist for `regrade_requests` and `notifications` tables

### Grade Not Updating
- **Check**: Was the request approved with valid points?
- **Verify**: Check `grade_audit_log` table for the change entry
- **Solution**: Check server logs for errors in `recalculateGradeAfterRegrade`

### Modal Not Showing Resolution Details
- **Check**: Is the request status "approved" or "rejected"?
- **Verify**: Check `regrade_requests` table for `resolved_at`, `resolution_notes`, and `points_awarded` fields
- **Solution**: Clear browser cache and reload

## 📊 Monitoring

### Check Notification Logs
```sql
-- View recent notifications
SELECT * FROM notifications 
WHERE event_type = 'regrade_request_resolved'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Regrade Request Status
```sql
-- View all regrade requests with resolution info
SELECT 
  rr.*,
  u.email as student_email,
  a.title as assignment_title
FROM regrade_requests rr
JOIN users u ON u.id = rr.student_id
JOIN assignments a ON a.id = rr.assignment_id
ORDER BY rr.created_at DESC;
```

### Check Grade Audit Log
```sql
-- View grade changes from regrade approvals
SELECT * FROM grade_audit_log
WHERE action = 'regrade_approved'
ORDER BY timestamp DESC;
```

## ✅ Success Criteria

Your implementation is working correctly if:
- ✅ Students receive notifications when requests are resolved
- ✅ Notifications include all required information (assignment, rubric item, decision, comment)
- ✅ Student UI displays resolution details correctly
- ✅ Grades update when requests are approved
- ✅ RLS policies prevent cross-student data access
- ✅ Notifications are logged in the database
- ✅ Audit trail is maintained for all changes

## 🎯 Next Steps

After testing locally:
1. Deploy database migrations to production
2. Configure production SendGrid/Twilio credentials
3. Test with real email/SMS delivery
4. Monitor notification delivery rates
5. Gather user feedback on notification content

## 📝 Notes

- **Mock Mode**: If email/SMS credentials are not configured, notifications will be logged but not sent. This is perfect for local testing.
- **Database Changes**: The RLS policies are critical for security. Make sure they're applied before testing.
- **Notification Service**: Uses service role key to bypass RLS when inserting notifications for users.
