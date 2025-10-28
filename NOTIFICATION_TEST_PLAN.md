# Notification System Test Plan

## Overview
This test plan covers the comprehensive testing of the notification system including authentication, access control, provider integration (SendGrid/Twilio), and user role-based workflows.

---

## 1. Authentication & Access Control Tests

### 1.1 Authenticated User Access
**Test ID:** AUTH-001  
**Objective:** Verify only authenticated users can trigger notifications  
**Steps:**
1. Login as a student
2. Submit an assignment
3. Verify notification is triggered for grading
4. Check notification appears in bell icon
5. Verify notification is logged in database with correct user_id

**Expected Result:** ✅ Notification sent and logged successfully

**Test ID:** AUTH-002  
**Objective:** Verify unauthenticated requests cannot access notifications  
**Steps:**
1. Logout from the application
2. Attempt to access `/dashboard/notifications` directly
3. Attempt to call `getUserNotifications()` API

**Expected Result:** ✅ Redirected to login page, API returns 401 Unauthorized

### 1.2 User Data Isolation
**Test ID:** AUTH-003  
**Objective:** Users can only view their own notifications  
**Steps:**
1. Login as Student A (user_id: A)
2. Note notifications visible in bell icon
3. Login as Student B (user_id: B)
4. Verify Student B cannot see Student A's notifications
5. Check database RLS policies prevent cross-user access

**Expected Result:** ✅ Each user sees only their own notifications

**Test ID:** AUTH-004  
**Objective:** Verify Row Level Security (RLS) enforcement  
**Steps:**
1. Query notifications table directly via Supabase
2. Attempt to read notifications for different user_id
3. Verify RLS blocks unauthorized access

**Expected Result:** ✅ RLS policies prevent unauthorized data access

---

## 2. Instructor Flow Tests

### 2.1 Grade Release Notifications
**Test ID:** INST-001  
**Objective:** Students receive notifications when grades are posted  
**Steps:**
1. Login as Instructor
2. Navigate to TA dashboard
3. Grade a student submission (grade: 95, feedback: "Great work!")
4. Verify notification is sent to student
5. Check SendGrid dashboard for email delivery
6. Check database for notification log entry

**Expected Result:** ✅ Student receives email notification with grade and feedback

**Test ID:** INST-002  
**Objective:** Multiple students receive notifications for batch grading  
**Steps:**
1. Login as Instructor
2. Grade 3 different student submissions
3. Verify each student receives individual notification
4. Check all 3 notifications appear in SendGrid activity

**Expected Result:** ✅ All students receive personalized notifications

### 2.2 Instructor Access Control
**Test ID:** INST-003  
**Objective:** Instructors cannot see other instructors' course notifications  
**Steps:**
1. Create Course A (Instructor 1) and Course B (Instructor 2)
2. Login as Instructor 1
3. Attempt to view notifications for Course B students
4. Verify access is denied

**Expected Result:** ✅ Instructors isolated to their own courses

---

## 3. TA Flow Tests

### 3.1 TA Grading Notifications
**Test ID:** TA-001  
**Objective:** Students notified when TA grades submission  
**Steps:**
1. Login as TA
2. Grade a student submission
3. Verify student receives notification
4. Check notification shows TA as grader

**Expected Result:** ✅ Student receives notification from TA grading

**Test ID:** TA-002  
**Objective:** TA regrade triggers new notification  
**Steps:**
1. Login as TA
2. Update grade for previously graded submission
3. Verify student receives updated notification
4. Check notification shows new grade

**Expected Result:** ✅ Student notified of grade update

### 3.2 TA Access Control
**Test ID:** TA-003  
**Objective:** TAs cannot trigger notifications outside assigned courses  
**Steps:**
1. Assign TA to Course A only
2. Login as TA
3. Attempt to grade submission from Course B
4. Verify action is blocked

**Expected Result:** ✅ TA access restricted to assigned courses

---

## 4. Student Flow Tests

### 4.1 Document Upload Notifications
**Test ID:** STU-001  
**Objective:** Instructor/TAs notified when student uploads document  
**Steps:**
1. Login as Student
2. Submit assignment with PDF attachment
3. Verify instructor receives notification
4. Verify all TAs in course receive notification
5. Check notification message includes filename

**Expected Result:** ✅ Instructor and TAs receive upload notification

**Test ID:** STU-002  
**Objective:** Student receives notification when graded  
**Steps:**
1. Login as Student
2. Wait for instructor to grade submission
3. Check bell icon for unread notification badge
4. Click bell to view notification
5. Verify grade and feedback are displayed

**Expected Result:** ✅ Student sees grade notification in UI

### 4.2 Student Access Control
**Test ID:** STU-003  
**Objective:** Students cannot view other students' notifications  
**Steps:**
1. Login as Student A
2. Note notification count and content
3. Login as Student B
4. Verify different notification set
5. Attempt direct database query for Student A's notifications

**Expected Result:** ✅ Students isolated to own notifications

---

## 5. Twilio SMS Provider Tests

### 5.1 Successful SMS Delivery
**Test ID:** SMS-001  
**Objective:** Send test SMS and confirm delivery  
**Steps:**
1. Add phone number to user: `UPDATE users SET phone = '+1234567890' WHERE id = 'user-id'`
2. Trigger notification via test page
3. Check Twilio dashboard for message delivery
4. Verify SMS received on phone
5. Check database status = "sent"

**Expected Result:** ✅ SMS delivered successfully, status logged

**Test ID:** SMS-002  
**Objective:** Verify SMS content is correct  
**Steps:**
1. Send notification with specific message
2. Receive SMS on phone
3. Verify message content matches expected format
4. Check sender number is correct Twilio number

**Expected Result:** ✅ SMS content accurate and properly formatted

### 5.2 SMS Failure Handling
**Test ID:** SMS-003  
**Objective:** Handle invalid phone number gracefully  
**Steps:**
1. Set user phone to invalid format: "123-invalid"
2. Trigger notification
3. Check error is caught and logged
4. Verify database status = "failed"
5. Verify error_message contains details

**Expected Result:** ✅ Error handled gracefully, logged in database

**Test ID:** SMS-004  
**Objective:** Handle Twilio API errors  
**Steps:**
1. Use invalid Twilio credentials
2. Trigger notification
3. Verify error is caught
4. Check error logged with status "failed"

**Expected Result:** ✅ API error handled, no system crash

### 5.3 SMS Rate Limiting
**Test ID:** SMS-005  
**Objective:** Handle rate limit responses  
**Steps:**
1. Send multiple SMS in rapid succession
2. Monitor for rate limit errors (429 status)
3. Verify retry logic activates
4. Check failed messages are logged

**Expected Result:** ✅ Rate limits handled, retries attempted

---

## 6. SendGrid Email Provider Tests

### 6.1 Successful Email Delivery
**Test ID:** EMAIL-001  
**Objective:** Send test email and confirm receipt  
**Steps:**
1. Trigger notification to verified email address
2. Check SendGrid dashboard for 202 Accepted status
3. Verify email received in inbox
4. Check database status = "sent"
5. Verify message_id is logged

**Expected Result:** ✅ Email delivered, status logged with message ID

**Test ID:** EMAIL-002  
**Objective:** Verify email HTML formatting  
**Steps:**
1. Send notification with grade and feedback
2. Open received email
3. Verify HTML renders correctly
4. Check grade and feedback are displayed
5. Verify sender email matches configured from address

**Expected Result:** ✅ Email properly formatted with all content

### 6.2 Email Failure Handling
**Test ID:** EMAIL-003  
**Objective:** Handle invalid API key  
**Steps:**
1. Set SENDGRID_API_KEY to invalid value
2. Restart server
3. Trigger notification
4. Verify error is caught
5. Check database status = "failed"
6. Verify error message logged

**Expected Result:** ✅ Invalid API key error handled gracefully

**Test ID:** EMAIL-004  
**Objective:** Handle blocked domain  
**Steps:**
1. Send email to blocked/invalid domain
2. Monitor SendGrid response
3. Verify error is logged
4. Check database has failure status

**Expected Result:** ✅ Domain error handled, logged appropriately

### 6.3 Email Retry Logic
**Test ID:** EMAIL-005  
**Objective:** Handle temporary service errors  
**Steps:**
1. Simulate SendGrid service outage (500 error)
2. Trigger notification
3. Verify retry logic activates
4. Monitor retry attempts
5. Check final status after retries exhausted

**Expected Result:** ✅ Retries attempted, final status logged

---

## 7. Integration Tests

### 7.1 End-to-End Notification Flow
**Test ID:** INT-001  
**Objective:** Complete grading workflow with notifications  
**Steps:**
1. Student submits assignment with document
2. Verify instructor receives upload notification (email)
3. Instructor grades submission
4. Verify student receives grade notification (email + SMS if phone exists)
5. Check all notifications logged in database
6. Verify UI shows notifications in bell icon

**Expected Result:** ✅ Complete flow works end-to-end

**Test ID:** INT-002  
**Objective:** Both providers process messages correctly  
**Steps:**
1. Add phone number to user
2. Trigger notification
3. Verify SendGrid receives email request (check logs)
4. Verify Twilio receives SMS request (check logs)
5. Check both providers return success
6. Verify 2 database entries (one email, one SMS)

**Expected Result:** ✅ Both providers process successfully

### 7.2 Mock Mode Testing
**Test ID:** INT-003  
**Objective:** Verify mock mode for development  
**Steps:**
1. Set NOTIFICATION_MOCK_MODE=true
2. Restart server
3. Trigger notification
4. Check console logs show MockProvider output
5. Verify database status = "mock"
6. Confirm no real emails/SMS sent

**Expected Result:** ✅ Mock mode works, no real messages sent

### 7.3 Success and Failure Logging
**Test ID:** INT-004  
**Objective:** Verify all outcomes are logged  
**Steps:**
1. Send successful notification
2. Send failed notification (invalid credentials)
3. Query notifications table
4. Verify both entries exist with correct status
5. Check error_message populated for failure
6. Verify metadata contains timestamp

**Expected Result:** ✅ All outcomes logged with appropriate details

---

## 8. UI/UX Tests

### 8.1 Notification Bell Widget
**Test ID:** UI-001  
**Objective:** Bell icon shows unread count  
**Steps:**
1. Send 3 notifications to user
2. Login as user
3. Check bell icon shows badge with "3"
4. Click bell to open dropdown
5. Verify 3 notifications displayed

**Expected Result:** ✅ Unread count accurate, dropdown shows notifications

**Test ID:** UI-002  
**Objective:** Mark as read functionality  
**Steps:**
1. Open notification dropdown
2. Click on a notification
3. Verify notification marked as read
4. Check unread count decreases
5. Verify read_at timestamp in database

**Expected Result:** ✅ Mark as read works, count updates

### 8.2 Notifications Page
**Test ID:** UI-003  
**Objective:** Full notifications page displays history  
**Steps:**
1. Navigate to /dashboard/notifications
2. Verify all notifications displayed
3. Test filter by "All" and "Unread"
4. Click "Mark all as read"
5. Verify all notifications marked as read

**Expected Result:** ✅ Notifications page fully functional

---

## 9. Performance Tests

### 9.1 Bulk Notifications
**Test ID:** PERF-001  
**Objective:** Handle multiple simultaneous notifications  
**Steps:**
1. Grade 50 submissions simultaneously
2. Monitor notification processing time
3. Verify all 50 students receive notifications
4. Check for any failures or timeouts

**Expected Result:** ✅ All notifications processed within acceptable time

### 9.2 Database Query Performance
**Test ID:** PERF-002  
**Objective:** Notification queries are efficient  
**Steps:**
1. Insert 1000 notifications for a user
2. Load notifications page
3. Monitor query execution time
4. Verify pagination/limiting works
5. Check indexes are being used

**Expected Result:** ✅ Queries execute quickly with proper indexing

---

## 10. Security Tests

### 10.1 SQL Injection Prevention
**Test ID:** SEC-001  
**Objective:** Prevent SQL injection in notification queries  
**Steps:**
1. Attempt to inject SQL in notification message
2. Verify input is sanitized
3. Check no unauthorized database access

**Expected Result:** ✅ SQL injection prevented

### 10.2 API Key Security
**Test ID:** SEC-002  
**Objective:** API keys not exposed in logs or responses  
**Steps:**
1. Trigger notification
2. Check server logs
3. Verify API keys are not logged
4. Check browser network tab
5. Verify keys not in client responses

**Expected Result:** ✅ API keys remain secure

---

## Test Execution Summary

### Priority Levels
- **P0 (Critical):** AUTH-001, AUTH-003, INST-001, EMAIL-001, SMS-001, INT-001
- **P1 (High):** All remaining AUTH, INST, TA, STU tests
- **P2 (Medium):** Provider failure handling, retry logic
- **P3 (Low):** Performance, edge cases

### Test Environment Requirements
- Supabase database with notifications table
- SendGrid account with verified sender
- Twilio account with phone number
- Test users (student, TA, instructor roles)
- Valid API credentials in .env.local

### Success Criteria
- ✅ All P0 tests pass
- ✅ 95%+ of P1 tests pass
- ✅ No critical security vulnerabilities
- ✅ Email and SMS delivery confirmed
- ✅ All user roles properly isolated

---

## Appendix: Test Data

### Sample Users
```sql
-- Student
user_id: '6d76db8a-4080-4a40-931c-f3d105e3d7bb'
email: 'student@test.com'
phone: '+11234567890'

-- Instructor
user_id: 'instructor-123'
email: 'instructor@test.com'

-- TA
user_id: 'ta-456'
email: 'ta@test.com'
```

### Sample Notification
```json
{
  "user_id": "6d76db8a-4080-4a40-931c-f3d105e3d7bb",
  "event_type": "submission_graded",
  "provider": "email",
  "status": "sent",
  "message": "{\"to\":\"student@test.com\",\"subject\":\"Your submission has been graded\",\"body\":\"<h2>Hello Student,</h2><p>Grade: 95</p>\"}"
}
```
