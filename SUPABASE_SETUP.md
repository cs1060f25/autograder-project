# Quick Supabase Setup Guide

This is a quick-start guide to get your Supabase database up and running with mock data.

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Add to your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run Database Migrations

Go to your Supabase project dashboard → **SQL Editor**

Run these files in order:
1. `supabase/migrations/20250127000000_initial_schema.sql`
2. `supabase/migrations/20250127000001_rls_policies.sql`
3. `supabase/migrations/20250127000002_storage_setup.sql`

### 4. Seed Mock Data

Create test users:
```bash
npm run db:seed
```

Then in Supabase SQL Editor, run:
1. `supabase/seed.sql`
2. `supabase/seed_assignments.sql`

### 5. Generate Sample PDFs (Optional)
```bash
npm run db:generate-pdfs
```

## ✅ You're Done!

Test the application with these credentials (password: `password123`):

- **Instructor**: `instructor1@university.edu`
- **TA**: `ta1@university.edu`
- **Student**: `student1@university.edu`

## 📚 Full Documentation

For detailed documentation, see: [`supabase/README.md`](./supabase/README.md)

## 🗂️ What You Get

### Database Tables
- ✅ 8 tables with proper relationships
- ✅ Row Level Security enabled
- ✅ Automatic timestamps
- ✅ Indexes for performance

### Mock Data
- ✅ 3 Instructors
- ✅ 5 Teaching Assistants
- ✅ 15 Students
- ✅ 6 Courses
- ✅ 23 Assignments with rubrics
- ✅ Multiple submissions in various states

### Storage
- ✅ Assignment files bucket (public)
- ✅ Submission files bucket (private)
- ✅ Role-based access policies

## 🔧 Troubleshooting

**Issue**: Migration fails
- Make sure you run migrations in order
- Check for syntax errors in SQL Editor

**Issue**: Can't login with test users
- Verify you ran `npm run db:seed`
- Check that users exist in Authentication → Users

**Issue**: Permission denied errors
- Ensure RLS policies migration ran successfully
- Verify user has correct role in `users` table

**Issue**: Can't upload files
- Check that storage migration ran
- Verify buckets exist in Storage section

## 📞 Need Help?

See the full documentation in `supabase/README.md` for:
- Detailed schema information
- Complete list of test users
- Storage bucket configuration
- Advanced troubleshooting
- Database reset instructions
