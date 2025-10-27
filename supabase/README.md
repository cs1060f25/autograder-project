# Supabase Database Setup Guide

This guide walks you through setting up the Supabase database with all necessary tables, Row Level Security policies, storage buckets, and mock data for testing.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Database Schema Overview](#database-schema-overview)
- [Setup Instructions](#setup-instructions)
- [Seeding Mock Data](#seeding-mock-data)
- [Test User Credentials](#test-user-credentials)
- [Storage Buckets](#storage-buckets)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:

1. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
2. **Environment Variables**: Set up your `.env.local` file with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. **Node.js Dependencies**:
   ```bash
   npm install -D tsx pdf-lib
   ```

## Database Schema Overview

The autograder application uses the following tables:

### Core Tables
- **`users`** - User profiles with roles (instructor, TA, student)
- **`courses`** - Course information
- **`assignments`** - Assignment details and instructions
- **`submissions`** - Student submissions with attachments
- **`rubrics`** - Grading criteria for assignments
- **`rubric_scores`** - Individual rubric scores per submission

### Relationship Tables
- **`course_enrollments`** - Student-course relationships
- **`course_ta_assignments`** - TA-course relationships

### Storage Buckets
- **`assignment-files`** - Instructor assignment attachments (public)
- **`submission-files`** - Student submission PDFs (private, access-controlled)

## Setup Instructions

### Step 1: Run Database Migrations

Run the migration files in order through the Supabase SQL Editor:

#### 1.1 Create Tables
Navigate to your Supabase project → **SQL Editor** → **New Query**

Copy and paste the contents of:
```
supabase/migrations/20250127000000_initial_schema.sql
```

Click **Run** to execute.

This creates:
- All database tables
- Indexes for performance
- Triggers for automatic `updated_at` timestamps

#### 1.2 Enable Row Level Security
In a new SQL Editor query, run:
```
supabase/migrations/20250127000001_rls_policies.sql
```

This sets up:
- RLS policies for all tables
- Role-based access control (instructor, TA, student)
- Helper functions for permission checks

#### 1.3 Configure Storage
In a new SQL Editor query, run:
```
supabase/migrations/20250127000002_storage_setup.sql
```

This creates:
- Storage buckets for files
- Storage access policies

### Step 2: Verify Migration Success

Check that tables were created:
1. Go to **Table Editor** in Supabase dashboard
2. You should see all tables: `users`, `courses`, `assignments`, etc.

Check that RLS is enabled:
1. Click on any table
2. Look for "RLS enabled" indicator
3. Click "Policies" to see the access rules

## Seeding Mock Data

### Option A: Automated Seeding (Recommended)

Run the TypeScript seeding script:

```bash
# Create auth users and profiles
npx tsx scripts/seed-database.ts
```

This will:
- Create 23 test users (3 instructors, 5 TAs, 15 students)
- Set up user profiles with roles
- Display next steps for manual SQL seeding

After running the script, complete the seeding by:

1. Go to Supabase **SQL Editor**
2. Run `supabase/seed.sql` - Creates courses, enrollments, and TA assignments
3. Run `supabase/seed_assignments.sql` - Creates assignments, rubrics, and submissions

### Option B: Manual Seeding

If you prefer manual control:

1. **Create Auth Users** via Supabase Dashboard:
   - Go to **Authentication** → **Users** → **Add user**
   - Create users manually with emails from `seed.sql` comments
   - Set password: `password123` for all test users

2. **Run SQL Files**:
   - Execute `supabase/seed.sql`
   - Execute `supabase/seed_assignments.sql`

### Generate Sample PDFs (Optional)

Generate sample PDF files for testing submissions:

```bash
npx tsx scripts/generate-sample-pdfs.ts
```

This creates sample PDFs in `sample-pdfs/` directory that you can upload through the UI.

## Test User Credentials

All test users have the password: **`password123`**

### Instructors
- **Dr. Sarah Smith**: `instructor1@university.edu`
  - Teaches: CS101, CS201
- **Prof. Michael Johnson**: `instructor2@university.edu`
  - Teaches: CS301, CS250
- **Dr. Emily Williams**: `instructor3@university.edu`
  - Teaches: CS401, CS350

### Teaching Assistants
- **Alex Chen**: `ta1@university.edu` (CS101, CS250)
- **Jordan Martinez**: `ta2@university.edu` (CS101, CS401)
- **Taylor Brown**: `ta3@university.edu` (CS201, CS401)
- **Morgan Davis**: `ta4@university.edu` (CS301, CS350)
- **Casey Wilson**: `ta5@university.edu` (CS301)

### Students
- **Alice Anderson**: `student1@university.edu`
- **Bob Baker**: `student2@university.edu`
- **Carol Carter**: `student3@university.edu`
- ... (15 students total)

## Storage Buckets

### Assignment Files Bucket
- **Name**: `assignment-files`
- **Access**: Public (anyone can view)
- **Purpose**: Store instructor assignment attachments
- **Max Size**: 50MB per file
- **Allowed Types**: PDF, images, Word documents

### Submission Files Bucket
- **Name**: `submission-files`
- **Access**: Private (role-based)
- **Purpose**: Store student submission PDFs
- **Max Size**: 50MB per file
- **Allowed Types**: PDF, images, text files

**Access Rules**:
- Students can upload/view their own files
- Instructors can view all submissions for their assignments
- TAs can view submissions for their assigned courses

## Mock Data Summary

The seed data includes:

### Courses (6 total)
- CS101: Introduction to Computer Science (8 students)
- CS201: Data Structures and Algorithms (6 students)
- CS301: Database Systems (7 students)
- CS250: Web Development (5 students)
- CS401: Machine Learning (4 students)
- CS350: Software Engineering (6 students)

### Assignments (23 total)
- 5 assignments for CS101
- 4 assignments for CS201
- 3 assignments for CS301
- 4 assignments for CS250
- 3 assignments for CS401
- 4 assignments for CS350

### Submissions (Various States)
- **Graded**: Completed submissions with scores and feedback
- **Submitted**: Waiting for grading
- **Draft**: In-progress submissions

### Rubrics
Each assignment has a detailed rubric with multiple criteria for grading.

## Testing Different User Roles

### As an Instructor
1. Login as `instructor1@university.edu`
2. You should see:
   - Your courses (CS101, CS201)
   - All assignments for your courses
   - All student submissions
   - Ability to create new courses/assignments
   - Ability to grade submissions

### As a TA
1. Login as `ta1@university.edu`
2. You should see:
   - Assigned courses (CS101, CS250)
   - Published assignments
   - Pending submissions to grade
   - Ability to grade submissions

### As a Student
1. Login as `student1@university.edu`
2. You should see:
   - Enrolled courses
   - Published assignments
   - Your own submissions
   - Ability to submit assignments
   - Your grades and feedback

## Troubleshooting

### Issue: "relation does not exist" error
**Solution**: Make sure you ran the initial schema migration first.

### Issue: "permission denied" errors
**Solution**: 
1. Check that RLS policies were applied
2. Verify you're logged in with the correct user
3. Check that the user has the correct role in the `users` table

### Issue: Can't upload files to storage
**Solution**:
1. Verify storage buckets were created
2. Check storage policies in Supabase dashboard
3. Ensure file size is under 50MB
4. Verify file type is allowed

### Issue: Auth users created but no profiles
**Solution**: 
1. Check that the `users` table exists
2. Manually insert profiles using the user IDs from auth.users
3. Ensure the seed script completed successfully

### Issue: Seed script fails
**Solution**:
1. Verify environment variables are set correctly
2. Check that you're using the service role key (not anon key)
3. Run SQL files manually through Supabase dashboard

## Resetting the Database

To start fresh:

1. **Delete all data**:
   ```sql
   -- Run in SQL Editor
   TRUNCATE TABLE rubric_scores CASCADE;
   TRUNCATE TABLE submissions CASCADE;
   TRUNCATE TABLE rubrics CASCADE;
   TRUNCATE TABLE assignments CASCADE;
   TRUNCATE TABLE course_ta_assignments CASCADE;
   TRUNCATE TABLE course_enrollments CASCADE;
   TRUNCATE TABLE courses CASCADE;
   TRUNCATE TABLE users CASCADE;
   ```

2. **Delete auth users**:
   - Go to Authentication → Users
   - Delete all test users

3. **Re-run setup**:
   - Follow the setup instructions from the beginning

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Documentation](https://supabase.com/docs/guides/storage)

## Support

If you encounter issues not covered in this guide:
1. Check the Supabase dashboard logs
2. Review the SQL error messages
3. Verify your environment variables
4. Check that all migrations ran successfully
