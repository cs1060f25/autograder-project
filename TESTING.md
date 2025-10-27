# Testing Your Supabase Setup

Quick guide to verify your Supabase database implementation is working correctly.

## 🚀 Quick Test

Run the automated test script:

```bash
npm run db:test
```

This will verify:
- ✅ All 8 database tables exist
- ✅ Storage buckets are configured
- ✅ Seed data is loaded (23 users, 6 courses, 23 assignments)
- ✅ Authentication works for all user roles
- ✅ Row Level Security policies are enforced
- ✅ Data integrity and relationships are correct

### Expected Output

```
🧪 Starting Supabase Setup Tests...

============================================================

📊 Testing Database Schema...
   ✅ Table 'users' exists
   ✅ Table 'courses' exists
   ✅ Table 'assignments' exists
   ✅ Table 'submissions' exists
   ✅ Table 'rubrics' exists
   ✅ Table 'rubric_scores' exists
   ✅ Table 'course_enrollments' exists
   ✅ Table 'course_ta_assignments' exists

📁 Testing Storage Buckets...
   ✅ assignment-files bucket exists
   ✅ submission-files bucket exists

🌱 Testing Seed Data...
   ✅ Users seeded: Found 23 users
   ✅ Instructors seeded: Found 3 instructors
   ✅ TAs seeded: Found 5 TAs
   ✅ Students seeded: Found 15 students
   ✅ Courses seeded: Found 6 courses
   ✅ Assignments seeded: Found 23 assignments
   ✅ Submissions seeded: Found 20 submissions

🔐 Testing Authentication...
   ✅ Instructor can login
   ✅ TA can login
   ✅ Student can login
   ✅ Invalid login fails

🔒 Testing Row Level Security Policies...
   ✅ Instructor can view courses
   ✅ Instructor can view assignments
   ✅ TA can view assigned courses
   ✅ TA can view submissions
   ✅ Student can view enrolled courses
   ✅ Student can view own submissions
   ✅ Unauthenticated users cannot access data

🔗 Testing Data Integrity...
   ✅ All assignments have a course
   ✅ All submissions have student and assignment
   ✅ Course enrollments exist

🔗 Testing Table Relationships...
   ✅ Course -> Assignments relationship works
   ✅ Assignment -> Rubric relationship works
   ✅ Submission -> Student relationship works

============================================================

📊 Test Results:
   ✅ Passed: 35
   ❌ Failed: 0
   📈 Total:  35

🎉 All tests passed! Your Supabase setup is working correctly.
```

---

## 🧪 Manual Testing

If you prefer to test manually or need to debug specific issues:

### 1. Test in Supabase Dashboard

**Check Tables:**
1. Go to Supabase Dashboard → **Table Editor**
2. Verify all 8 tables exist with data
3. Check that RLS is enabled (green badge)

**Check Storage:**
1. Go to **Storage**
2. Verify `assignment-files` and `submission-files` buckets exist

**Check Users:**
1. Go to **Authentication** → **Users**
2. Verify 23 users exist

### 2. Test in Application

**Start the dev server:**
```bash
npm run dev
```

**Test as Instructor:**
1. Go to http://localhost:3000/login
2. Login: `instructor1@university.edu` / `password123`
3. Should see: CS101 and CS201 courses
4. Click on a course → Should see assignments and students

**Test as TA:**
1. Logout and login: `ta1@university.edu` / `password123`
2. Should see: Assigned courses (CS101, CS250)
3. Should see: Pending grading queue

**Test as Student:**
1. Logout and login: `student1@university.edu` / `password123`
2. Should see: Enrolled courses
3. Should see: Published assignments
4. Click on assignment → Should see submission interface

---

## 🔍 Troubleshooting Failed Tests

### "Table does not exist" errors

**Problem:** Migrations haven't been run

**Fix:**
```bash
# Run migrations in Supabase SQL Editor:
# 1. supabase/migrations/20250127000000_initial_schema.sql
# 2. supabase/migrations/20250127000001_rls_policies.sql
# 3. supabase/migrations/20250127000002_storage_setup.sql
```

### "Users seeded" test fails

**Problem:** Seed data hasn't been loaded

**Fix:**
```bash
# Create auth users
npm run db:seed

# Then run in Supabase SQL Editor:
# 1. supabase/seed.sql
# 2. supabase/seed_assignments.sql
```

### "Cannot login" errors

**Problem:** Auth users don't exist

**Fix:**
```bash
npm run db:seed
```

### "RLS policy" tests fail

**Problem:** RLS policies not applied

**Fix:**
```bash
# Run in Supabase SQL Editor:
# supabase/migrations/20250127000001_rls_policies.sql
```

### Environment variable errors

**Problem:** Missing `.env.local` configuration

**Fix:**
```bash
# Create .env.local with:
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

---

## 📊 What Each Test Checks

### Database Schema Tests
- Verifies all 8 tables are created
- Ensures tables are accessible

### Storage Bucket Tests
- Confirms both buckets exist
- Verifies bucket configuration

### Seed Data Tests
- Counts users by role (3 instructors, 5 TAs, 15 students)
- Verifies courses, assignments, and submissions exist
- Ensures minimum data thresholds are met

### Authentication Tests
- Tests login for each user role
- Verifies passwords work
- Confirms invalid logins are rejected

### RLS Policy Tests
- Instructors can access their courses and assignments
- TAs can access assigned courses only
- Students can access enrolled courses only
- Unauthenticated users cannot access any data

### Data Integrity Tests
- All foreign keys are valid
- No orphaned records exist
- Relationships are properly established

### Relationship Tests
- Course → Assignments join works
- Assignment → Rubric join works
- Submission → Student join works

---

## ✅ Success Criteria

All tests should pass for a complete setup:

- **35/35 tests passing** = Perfect! ✅
- **30-34 tests passing** = Good, minor issues 🟡
- **< 30 tests passing** = Setup incomplete ❌

---

## 🎯 Next Steps After Tests Pass

1. **Generate sample PDFs** (optional):
   ```bash
   npm run db:generate-pdfs
   ```

2. **Test the full application**:
   - Create a new assignment as instructor
   - Submit work as student
   - Grade submission as TA

3. **Review documentation**:
   - See `VERIFICATION_GUIDE.md` for detailed manual testing
   - See `supabase/README.md` for schema details

---

## 📞 Need Help?

If tests continue to fail:

1. Check Supabase dashboard logs for errors
2. Verify all migrations ran without errors
3. Ensure environment variables are correct
4. Review `VERIFICATION_GUIDE.md` for detailed troubleshooting
5. Check that your Supabase project is active (not paused)
