-- Seed Data for Autograder Project
-- This file contains comprehensive mock data for testing all user roles and features
-- 
-- IMPORTANT: This seed file assumes users are created through Supabase Auth
-- You'll need to create auth users first, then run this seed to populate profiles
-- See the seed-data.ts script for automated seeding with auth user creation

-- ============================================================================
-- MOCK USER PROFILES
-- ============================================================================
-- Note: In production, these would be created via Supabase Auth
-- For testing, you'll need to create these users in auth.users first
-- Then insert their profiles here with matching UUIDs

-- Sample UUIDs (replace with actual auth.users IDs after creation)
-- Instructors
-- 11111111-1111-1111-1111-111111111111 - Dr. Sarah Smith (instructor1@university.edu)
-- 22222222-2222-2222-2222-222222222222 - Prof. Michael Johnson (instructor2@university.edu)
-- 33333333-3333-3333-3333-333333333333 - Dr. Emily Williams (instructor3@university.edu)

-- TAs
-- 44444444-4444-4444-4444-444444444444 - Alex Chen (ta1@university.edu)
-- 55555555-5555-5555-5555-555555555555 - Jordan Martinez (ta2@university.edu)
-- 66666666-6666-6666-6666-666666666666 - Taylor Brown (ta3@university.edu)
-- 77777777-7777-7777-7777-777777777777 - Morgan Davis (ta4@university.edu)
-- 88888888-8888-8888-8888-888888888888 - Casey Wilson (ta5@university.edu)

-- Students
-- a1111111-1111-1111-1111-111111111111 - Alice Anderson (student1@university.edu)
-- a2222222-2222-2222-2222-222222222222 - Bob Baker (student2@university.edu)
-- a3333333-3333-3333-3333-333333333333 - Carol Carter (student3@university.edu)
-- a4444444-4444-4444-4444-444444444444 - David Davis (student4@university.edu)
-- a5555555-5555-5555-5555-555555555555 - Emma Evans (student5@university.edu)
-- a6666666-6666-6666-6666-666666666666 - Frank Foster (student6@university.edu)
-- a7777777-7777-7777-7777-777777777777 - Grace Garcia (student7@university.edu)
-- a8888888-8888-8888-8888-888888888888 - Henry Harris (student8@university.edu)
-- a9999999-9999-9999-9999-999999999999 - Iris Jackson (student9@university.edu)
-- b1111111-1111-1111-1111-111111111111 - Jack Johnson (student10@university.edu)
-- b2222222-2222-2222-2222-222222222222 - Kelly King (student11@university.edu)
-- b3333333-3333-3333-3333-333333333333 - Liam Lee (student12@university.edu)
-- b4444444-4444-4444-4444-444444444444 - Mia Miller (student13@university.edu)
-- b5555555-5555-5555-5555-555555555555 - Noah Nelson (student14@university.edu)
-- b6666666-6666-6666-6666-666666666666 - Olivia O'Brien (student15@university.edu)

-- ============================================================================
-- INSERT USER PROFILES
-- ============================================================================
-- These inserts will work after auth users are created with matching IDs

INSERT INTO public.users (id, email, first_name, last_name, role) VALUES
-- Instructors
('11111111-1111-1111-1111-111111111111', 'instructor1@university.edu', 'Sarah', 'Smith', 'instructor'),
('22222222-2222-2222-2222-222222222222', 'instructor2@university.edu', 'Michael', 'Johnson', 'instructor'),
('33333333-3333-3333-3333-333333333333', 'instructor3@university.edu', 'Emily', 'Williams', 'instructor'),

-- TAs
('44444444-4444-4444-4444-444444444444', 'ta1@university.edu', 'Alex', 'Chen', 'ta'),
('55555555-5555-5555-5555-555555555555', 'ta2@university.edu', 'Jordan', 'Martinez', 'ta'),
('66666666-6666-6666-6666-666666666666', 'ta3@university.edu', 'Taylor', 'Brown', 'ta'),
('77777777-7777-7777-7777-777777777777', 'ta4@university.edu', 'Morgan', 'Davis', 'ta'),
('88888888-8888-8888-8888-888888888888', 'ta5@university.edu', 'Casey', 'Wilson', 'ta'),

-- Students
('a1111111-1111-1111-1111-111111111111', 'student1@university.edu', 'Alice', 'Anderson', 'student'),
('a2222222-2222-2222-2222-222222222222', 'student2@university.edu', 'Bob', 'Baker', 'student'),
('a3333333-3333-3333-3333-333333333333', 'student3@university.edu', 'Carol', 'Carter', 'student'),
('a4444444-4444-4444-4444-444444444444', 'student4@university.edu', 'David', 'Davis', 'student'),
('a5555555-5555-5555-5555-555555555555', 'student5@university.edu', 'Emma', 'Evans', 'student'),
('a6666666-6666-6666-6666-666666666666', 'student6@university.edu', 'Frank', 'Foster', 'student'),
('a7777777-7777-7777-7777-777777777777', 'student7@university.edu', 'Grace', 'Garcia', 'student'),
('a8888888-8888-8888-8888-888888888888', 'student8@university.edu', 'Henry', 'Harris', 'student'),
('a9999999-9999-9999-9999-999999999999', 'student9@university.edu', 'Iris', 'Jackson', 'student'),
('b1111111-1111-1111-1111-111111111111', 'student10@university.edu', 'Jack', 'Johnson', 'student'),
('b2222222-2222-2222-2222-222222222222', 'student11@university.edu', 'Kelly', 'King', 'student'),
('b3333333-3333-3333-3333-333333333333', 'student12@university.edu', 'Liam', 'Lee', 'student'),
('b4444444-4444-4444-4444-444444444444', 'student13@university.edu', 'Mia', 'Miller', 'student'),
('b5555555-5555-5555-5555-555555555555', 'student14@university.edu', 'Noah', 'Nelson', 'student'),
('b6666666-6666-6666-6666-666666666666', 'student15@university.edu', 'Olivia', 'O''Brien', 'student')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- INSERT COURSES
-- ============================================================================

INSERT INTO public.courses (id, name, code, description, instructor_id, semester, year) VALUES
-- Dr. Smith's courses
('c1111111-1111-1111-1111-111111111111', 'Introduction to Computer Science', 'CS101', 'Fundamental concepts of programming and computer science', '11111111-1111-1111-1111-111111111111', 'Fall', 2025),
('c2222222-2222-2222-2222-222222222222', 'Data Structures and Algorithms', 'CS201', 'Advanced data structures and algorithmic problem solving', '11111111-1111-1111-1111-111111111111', 'Fall', 2025),

-- Prof. Johnson's courses
('c3333333-3333-3333-3333-333333333333', 'Database Systems', 'CS301', 'Relational databases, SQL, and database design', '22222222-2222-2222-2222-222222222222', 'Fall', 2025),
('c4444444-4444-4444-4444-444444444444', 'Web Development', 'CS250', 'Modern web technologies and full-stack development', '22222222-2222-2222-2222-222222222222', 'Fall', 2025),

-- Dr. Williams's courses
('c5555555-5555-5555-5555-555555555555', 'Machine Learning', 'CS401', 'Introduction to machine learning algorithms and applications', '33333333-3333-3333-3333-333333333333', 'Fall', 2025),
('c6666666-6666-6666-6666-666666666666', 'Software Engineering', 'CS350', 'Software development methodologies and best practices', '33333333-3333-3333-3333-333333333333', 'Fall', 2025)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- INSERT COURSE ENROLLMENTS
-- ============================================================================

INSERT INTO public.course_enrollments (course_id, student_id, status) VALUES
-- CS101 students (8 students)
('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'active'),
('c1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'active'),
('c1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'active'),
('c1111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', 'active'),
('c1111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', 'active'),
('c1111111-1111-1111-1111-111111111111', 'a6666666-6666-6666-6666-666666666666', 'active'),
('c1111111-1111-1111-1111-111111111111', 'a7777777-7777-7777-7777-777777777777', 'active'),
('c1111111-1111-1111-1111-111111111111', 'a8888888-8888-8888-8888-888888888888', 'active'),

-- CS201 students (6 students)
('c2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'active'),
('c2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 'active'),
('c2222222-2222-2222-2222-222222222222', 'a5555555-5555-5555-5555-555555555555', 'active'),
('c2222222-2222-2222-2222-222222222222', 'a9999999-9999-9999-9999-999999999999', 'active'),
('c2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'active'),
('c2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'active'),

-- CS301 students (7 students)
('c3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 'active'),
('c3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', 'active'),
('c3333333-3333-3333-3333-333333333333', 'a6666666-6666-6666-6666-666666666666', 'active'),
('c3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'active'),
('c3333333-3333-3333-3333-333333333333', 'b4444444-4444-4444-4444-444444444444', 'active'),
('c3333333-3333-3333-3333-333333333333', 'b5555555-5555-5555-5555-555555555555', 'active'),
('c3333333-3333-3333-3333-333333333333', 'b6666666-6666-6666-6666-666666666666', 'active'),

-- CS250 students (5 students)
('c4444444-4444-4444-4444-444444444444', 'a7777777-7777-7777-7777-777777777777', 'active'),
('c4444444-4444-4444-4444-444444444444', 'a8888888-8888-8888-8888-888888888888', 'active'),
('c4444444-4444-4444-4444-444444444444', 'a9999999-9999-9999-9999-999999999999', 'active'),
('c4444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', 'active'),
('c4444444-4444-4444-4444-444444444444', 'b2222222-2222-2222-2222-222222222222', 'active'),

-- CS401 students (4 students)
('c5555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111', 'active'),
('c5555555-5555-5555-5555-555555555555', 'a3333333-3333-3333-3333-333333333333', 'active'),
('c5555555-5555-5555-5555-555555555555', 'b3333333-3333-3333-3333-333333333333', 'active'),
('c5555555-5555-5555-5555-555555555555', 'b4444444-4444-4444-4444-444444444444', 'active'),

-- CS350 students (6 students)
('c6666666-6666-6666-6666-666666666666', 'a5555555-5555-5555-5555-555555555555', 'active'),
('c6666666-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666', 'active'),
('c6666666-6666-6666-6666-666666666666', 'a7777777-7777-7777-7777-777777777777', 'active'),
('c6666666-6666-6666-6666-666666666666', 'b5555555-5555-5555-5555-555555555555', 'active'),
('c6666666-6666-6666-6666-666666666666', 'b6666666-6666-6666-6666-666666666666', 'active'),
('c6666666-6666-6666-6666-666666666666', 'a8888888-8888-8888-8888-888888888888', 'active')
ON CONFLICT (course_id, student_id) DO NOTHING;

-- ============================================================================
-- INSERT TA ASSIGNMENTS
-- ============================================================================

INSERT INTO public.course_ta_assignments (course_id, ta_id) VALUES
-- CS101 - Alex Chen, Jordan Martinez
('c1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444'),
('c1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555'),

-- CS201 - Taylor Brown
('c2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666'),

-- CS301 - Morgan Davis, Casey Wilson
('c3333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777'),
('c3333333-3333-3333-3333-333333333333', '88888888-8888-8888-8888-888888888888'),

-- CS250 - Alex Chen
('c4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444'),

-- CS401 - Jordan Martinez, Taylor Brown
('c5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555'),
('c5555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666'),

-- CS350 - Morgan Davis
('c6666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777')
ON CONFLICT (course_id, ta_id) DO NOTHING;

-- Continue in next part...
