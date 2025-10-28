-- Seed Data Part 2: Assignments, Rubrics, and Submissions
-- Run this after seed.sql

-- ============================================================================
-- INSERT ASSIGNMENTS
-- ============================================================================

INSERT INTO public.assignments (id, title, description, course_id, instructor_id, due_date, max_points, assignment_type, status, instructions) VALUES
-- CS101 Assignments
('a1111111-1111-1111-1111-111111111111', 'Hello World Program', 'Write your first program in Python', 'c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2025-09-15 23:59:00', 50.00, 'homework', 'published', 'Create a Python program that prints "Hello, World!" to the console. Submit your .py file.'),
('a1111112-1111-1111-1111-111111111111', 'Variables and Data Types', 'Practice with Python variables', 'c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2025-09-22 23:59:00', 75.00, 'homework', 'published', 'Write a program that demonstrates the use of different data types in Python.'),
('a1111113-1111-1111-1111-111111111111', 'Control Flow Exercise', 'If statements and loops', 'c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2025-09-29 23:59:00', 100.00, 'homework', 'published', 'Create a program using if-else statements and for/while loops.'),
('a1111114-1111-1111-1111-111111111111', 'Functions Assignment', 'Write reusable functions', 'c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2025-10-06 23:59:00', 100.00, 'homework', 'published', 'Implement at least 5 different functions with various parameters and return values.'),
('a1111115-1111-1111-1111-111111111111', 'Midterm Project', 'Build a simple calculator', 'c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2025-10-20 23:59:00', 200.00, 'project', 'published', 'Create a calculator program with basic operations (+, -, *, /).'),

-- CS201 Assignments
('a2222221-2222-2222-2222-222222222222', 'Array Operations', 'Implement array algorithms', 'c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '2025-09-18 23:59:00', 100.00, 'homework', 'published', 'Implement sorting and searching algorithms on arrays.'),
('a2222222-2222-2222-2222-222222222222', 'Linked Lists', 'Create a linked list data structure', 'c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '2025-09-25 23:59:00', 150.00, 'homework', 'published', 'Implement a singly linked list with insert, delete, and search operations.'),
('a2222223-2222-2222-2222-222222222222', 'Stack and Queue', 'Implement stack and queue', 'c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '2025-10-02 23:59:00', 150.00, 'homework', 'published', 'Create both stack and queue data structures with all standard operations.'),
('a2222224-2222-2222-2222-222222222222', 'Binary Search Trees', 'BST implementation', 'c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '2025-10-16 23:59:00', 200.00, 'homework', 'published', 'Implement a binary search tree with insert, delete, and traversal methods.'),

-- CS301 Assignments
('a3333331-3333-3333-3333-333333333333', 'SQL Basics', 'Write SQL queries', 'c3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '2025-09-20 23:59:00', 100.00, 'homework', 'published', 'Complete the SQL query exercises using SELECT, WHERE, JOIN, and GROUP BY.'),
('a3333332-3333-3333-3333-333333333333', 'Database Design', 'Design a relational database', 'c3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '2025-10-04 23:59:00', 150.00, 'homework', 'published', 'Create an ER diagram and normalize the database schema.'),
('a3333333-3333-3333-3333-333333333333', 'Advanced SQL', 'Complex queries and optimization', 'c3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '2025-10-18 23:59:00', 150.00, 'homework', 'published', 'Write complex SQL queries with subqueries, views, and stored procedures.'),

-- CS250 Assignments
('a4444441-4444-4444-4444-444444444444', 'HTML/CSS Basics', 'Create a static webpage', 'c4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '2025-09-17 23:59:00', 100.00, 'homework', 'published', 'Build a personal portfolio page using HTML and CSS.'),
('a4444442-4444-4444-4444-444444444444', 'JavaScript Fundamentals', 'Interactive web features', 'c4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '2025-09-24 23:59:00', 100.00, 'homework', 'published', 'Add JavaScript interactivity to your webpage.'),
('a4444443-4444-4444-4444-444444444444', 'React Components', 'Build React components', 'c4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '2025-10-08 23:59:00', 150.00, 'homework', 'published', 'Create reusable React components for a todo list application.'),
('a4444444-4444-4444-4444-444444444444', 'Full Stack Project', 'Build a complete web app', 'c4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '2025-11-01 23:59:00', 250.00, 'project', 'published', 'Create a full-stack web application with frontend and backend.'),

-- CS401 Assignments
('a5555551-5555-5555-5555-555555555555', 'Linear Regression', 'Implement linear regression', 'c5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', '2025-09-25 23:59:00', 150.00, 'homework', 'published', 'Implement linear regression from scratch using NumPy.'),
('a5555552-5555-5555-5555-555555555555', 'Classification Algorithms', 'Build classifiers', 'c5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', '2025-10-09 23:59:00', 150.00, 'homework', 'published', 'Implement k-NN and decision tree classifiers.'),
('a5555553-5555-5555-5555-555555555555', 'Neural Networks', 'Build a simple neural network', 'c5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', '2025-10-23 23:59:00', 200.00, 'homework', 'published', 'Create a feedforward neural network for image classification.'),

-- CS350 Assignments
('a6666661-6666-6666-6666-666666666666', 'Agile Methodology', 'Write about Agile practices', 'c6666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', '2025-09-19 23:59:00', 100.00, 'homework', 'published', 'Research and write a report on Agile software development.'),
('a6666662-6666-6666-6666-666666666666', 'Unit Testing', 'Write comprehensive tests', 'c6666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', '2025-10-03 23:59:00', 150.00, 'homework', 'published', 'Create unit tests for a provided codebase using Jest.'),
('a6666663-6666-6666-6666-666666666666', 'Code Review Exercise', 'Review and improve code', 'c6666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', '2025-10-17 23:59:00', 150.00, 'homework', 'published', 'Perform a code review and suggest improvements.'),
('a6666664-6666-6666-6666-666666666666', 'Team Project', 'Collaborative software project', 'c6666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', '2025-11-15 23:59:00', 300.00, 'project', 'published', 'Work in teams to build a software application using best practices.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- INSERT RUBRICS
-- ============================================================================

INSERT INTO public.rubrics (id, assignment_id, criteria, created_by) VALUES
-- CS101 Assignment Rubrics
('r1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 
'[
  {"id": "c1", "name": "Correctness", "description": "Program runs without errors", "max_points": 20},
  {"id": "c2", "name": "Output", "description": "Correct output displayed", "max_points": 20},
  {"id": "c3", "name": "Code Style", "description": "Clean and readable code", "max_points": 10}
]'::jsonb, '11111111-1111-1111-1111-111111111111'),

('r1111112-1111-1111-1111-111111111111', 'a1111112-1111-1111-1111-111111111111',
'[
  {"id": "c1", "name": "Variable Usage", "description": "Proper use of variables", "max_points": 25},
  {"id": "c2", "name": "Data Types", "description": "Demonstrates different data types", "max_points": 25},
  {"id": "c3", "name": "Code Quality", "description": "Clean and well-commented code", "max_points": 15},
  {"id": "c4", "name": "Documentation", "description": "Proper comments and documentation", "max_points": 10}
]'::jsonb, '11111111-1111-1111-1111-111111111111'),

('r1111113-1111-1111-1111-111111111111', 'a1111113-1111-1111-1111-111111111111',
'[
  {"id": "c1", "name": "If-Else Implementation", "description": "Correct use of conditional statements", "max_points": 30},
  {"id": "c2", "name": "Loop Implementation", "description": "Proper loop usage", "max_points": 30},
  {"id": "c3", "name": "Logic", "description": "Program logic is sound", "max_points": 25},
  {"id": "c4", "name": "Code Style", "description": "Readable and maintainable code", "max_points": 15}
]'::jsonb, '11111111-1111-1111-1111-111111111111'),

-- CS201 Assignment Rubrics
('r2222221-2222-2222-2222-222222222222', 'a2222221-2222-2222-2222-222222222222',
'[
  {"id": "c1", "name": "Algorithm Correctness", "description": "Algorithms work correctly", "max_points": 40},
  {"id": "c2", "name": "Efficiency", "description": "Optimal time complexity", "max_points": 30},
  {"id": "c3", "name": "Code Quality", "description": "Clean implementation", "max_points": 20},
  {"id": "c4", "name": "Testing", "description": "Comprehensive test cases", "max_points": 10}
]'::jsonb, '11111111-1111-1111-1111-111111111111'),

('r2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222',
'[
  {"id": "c1", "name": "Implementation", "description": "Linked list correctly implemented", "max_points": 50},
  {"id": "c2", "name": "Operations", "description": "All operations work correctly", "max_points": 50},
  {"id": "c3", "name": "Edge Cases", "description": "Handles edge cases properly", "max_points": 30},
  {"id": "c4", "name": "Memory Management", "description": "No memory leaks", "max_points": 20}
]'::jsonb, '11111111-1111-1111-1111-111111111111'),

-- CS301 Assignment Rubrics
('r3333331-3333-3333-3333-333333333333', 'a3333331-3333-3333-3333-333333333333',
'[
  {"id": "c1", "name": "Query Correctness", "description": "All queries return correct results", "max_points": 50},
  {"id": "c2", "name": "Query Efficiency", "description": "Queries are optimized", "max_points": 25},
  {"id": "c3", "name": "SQL Syntax", "description": "Proper SQL syntax used", "max_points": 25}
]'::jsonb, '22222222-2222-2222-2222-222222222222'),

-- CS250 Assignment Rubrics
('r4444441-4444-4444-4444-444444444444', 'a4444441-4444-4444-4444-444444444444',
'[
  {"id": "c1", "name": "HTML Structure", "description": "Semantic HTML used", "max_points": 30},
  {"id": "c2", "name": "CSS Styling", "description": "Attractive and responsive design", "max_points": 40},
  {"id": "c3", "name": "Functionality", "description": "All features work correctly", "max_points": 20},
  {"id": "c4", "name": "Creativity", "description": "Original and creative design", "max_points": 10}
]'::jsonb, '22222222-2222-2222-2222-222222222222'),

-- CS401 Assignment Rubrics
('r5555551-5555-5555-5555-555555555555', 'a5555551-5555-5555-5555-555555555555',
'[
  {"id": "c1", "name": "Implementation", "description": "Correct implementation from scratch", "max_points": 60},
  {"id": "c2", "name": "Accuracy", "description": "Model achieves good accuracy", "max_points": 40},
  {"id": "c3", "name": "Documentation", "description": "Well-documented code", "max_points": 30},
  {"id": "c4", "name": "Analysis", "description": "Thoughtful analysis of results", "max_points": 20}
]'::jsonb, '33333333-3333-3333-3333-333333333333'),

-- CS350 Assignment Rubrics
('r6666661-6666-6666-6666-666666666666', 'a6666661-6666-6666-6666-666666666666',
'[
  {"id": "c1", "name": "Research Quality", "description": "Thorough research conducted", "max_points": 40},
  {"id": "c2", "name": "Writing Quality", "description": "Clear and well-organized writing", "max_points": 30},
  {"id": "c3", "name": "Content", "description": "Covers all required topics", "max_points": 20},
  {"id": "c4", "name": "Citations", "description": "Proper citations and references", "max_points": 10}
]'::jsonb, '33333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- INSERT SUBMISSIONS (Various States)
-- ============================================================================

-- CS101 Submissions (Hello World - mostly graded)
INSERT INTO public.submissions (id, assignment_id, student_id, content, status, grade, feedback, graded_by, graded_at, submitted_at) VALUES
('s1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'print("Hello, World!")', 'graded', 50.00, 'Perfect! Great job on your first program.', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '5 days', NOW() - INTERVAL '7 days'),
('s1111112-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'print("Hello, World!")', 'graded', 48.00, 'Good work! Minor style improvements needed.', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '5 days', NOW() - INTERVAL '7 days'),
('s1111113-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'print("Hello, World!")', 'graded', 50.00, 'Excellent!', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '4 days', NOW() - INTERVAL '6 days'),
('s1111114-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', 'print("Hello, World!")', 'submitted', NULL, NULL, NULL, NULL, NOW() - INTERVAL '2 days'),
('s1111115-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', 'print("Hello, World!")', 'submitted', NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day'),

-- CS101 Variables Assignment (mix of states)
('s1111121-1111-1111-1111-111111111111', 'a1111112-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'x = 5\ny = "hello"\nz = 3.14\nprint(x, y, z)', 'graded', 70.00, 'Good demonstration of data types. Could use more examples.', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days'),
('s1111122-1111-1111-1111-111111111111', 'a1111112-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'Various data type examples...', 'submitted', NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day'),
('s1111123-1111-1111-1111-111111111111', 'a1111112-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'Working on it...', 'draft', NULL, NULL, NULL, NULL, NULL),

-- CS101 Control Flow (recent submissions)
('s1111131-1111-1111-1111-111111111111', 'a1111113-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'for i in range(10):\n  if i % 2 == 0:\n    print(i)', 'submitted', NULL, NULL, NULL, NULL, NOW() - INTERVAL '6 hours'),
('s1111132-1111-1111-1111-111111111111', 'a1111113-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'Control flow code...', 'submitted', NULL, NULL, NULL, NULL, NOW() - INTERVAL '12 hours'),

-- CS201 Submissions
('s2222221-2222-2222-2222-222222222222', 'a2222221-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Array sorting implementation...', 'graded', 95.00, 'Excellent implementation! Very efficient.', '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 days'),
('s2222222-2222-2222-2222-222222222222', 'a2222221-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 'Sorting algorithms...', 'submitted', NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day'),

-- CS301 Submissions
('s3333331-3333-3333-3333-333333333333', 'a3333331-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 'SELECT * FROM users WHERE...', 'graded', 90.00, 'Great SQL queries! Well optimized.', '77777777-7777-7777-7777-777777777777', NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days'),
('s3333332-3333-3333-3333-333333333333', 'a3333331-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', 'SQL queries...', 'submitted', NULL, NULL, NULL, NULL, NOW() - INTERVAL '2 days'),

-- CS250 Submissions
('s4444441-4444-4444-4444-444444444444', 'a4444441-4444-4444-4444-444444444444', 'a7777777-7777-7777-7777-777777777777', 'HTML/CSS portfolio code...', 'graded', 92.00, 'Beautiful design! Very creative.', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '4 days', NOW() - INTERVAL '6 days'),
('s4444442-4444-4444-4444-444444444444', 'a4444441-4444-4444-4444-444444444444', 'a8888888-8888-8888-8888-888888888888', 'Portfolio website...', 'submitted', NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day'),

-- CS401 Submissions
('s5555551-5555-5555-5555-555555555555', 'a5555551-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111', 'Linear regression implementation...', 'graded', 140.00, 'Strong implementation. Good analysis of results.', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 days'),

-- CS350 Submissions
('s6666661-6666-6666-6666-666666666666', 'a6666661-6666-6666-6666-666666666666', 'a5555555-5555-5555-5555-555555555555', 'Agile methodology report...', 'graded', 88.00, 'Well-researched report. Good understanding of Agile.', '77777777-7777-7777-7777-777777777777', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days'),
('s6666662-6666-6666-6666-666666666666', 'a6666661-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666', 'Agile report draft...', 'draft', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- INSERT RUBRIC SCORES (for graded submissions)
-- ============================================================================

INSERT INTO public.rubric_scores (submission_id, rubric_id, scores, total_score, graded_by) VALUES
-- CS101 Hello World scores
('s1111111-1111-1111-1111-111111111111', 'r1111111-1111-1111-1111-111111111111', 
'{"c1": 20, "c2": 20, "c3": 10}'::jsonb, 50.00, '44444444-4444-4444-4444-444444444444'),

('s1111112-1111-1111-1111-111111111111', 'r1111111-1111-1111-1111-111111111111',
'{"c1": 20, "c2": 20, "c3": 8}'::jsonb, 48.00, '44444444-4444-4444-4444-444444444444'),

('s1111113-1111-1111-1111-111111111111', 'r1111111-1111-1111-1111-111111111111',
'{"c1": 20, "c2": 20, "c3": 10}'::jsonb, 50.00, '55555555-5555-5555-5555-555555555555'),

-- CS101 Variables scores
('s1111121-1111-1111-1111-111111111111', 'r1111112-1111-1111-1111-111111111111',
'{"c1": 22, "c2": 23, "c3": 15, "c4": 10}'::jsonb, 70.00, '44444444-4444-4444-4444-444444444444'),

-- CS201 scores
('s2222221-2222-2222-2222-222222222222', 'r2222221-2222-2222-2222-222222222222',
'{"c1": 38, "c2": 30, "c3": 18, "c4": 9}'::jsonb, 95.00, '66666666-6666-6666-6666-666666666666'),

-- CS301 scores
('s3333331-3333-3333-3333-333333333333', 'r3333331-3333-3333-3333-333333333333',
'{"c1": 48, "c2": 22, "c3": 20}'::jsonb, 90.00, '77777777-7777-7777-7777-777777777777'),

-- CS250 scores
('s4444441-4444-4444-4444-444444444444', 'r4444441-4444-4444-4444-444444444444',
'{"c1": 28, "c2": 38, "c3": 18, "c4": 8}'::jsonb, 92.00, '44444444-4444-4444-4444-444444444444'),

-- CS401 scores
('s5555551-5555-5555-5555-555555555555', 'r5555551-5555-5555-5555-555555555555',
'{"c1": 58, "c2": 35, "c3": 28, "c4": 19}'::jsonb, 140.00, '55555555-5555-5555-5555-555555555555'),

-- CS350 scores
('s6666661-6666-6666-6666-666666666666', 'r6666661-6666-6666-6666-666666666666',
'{"c1": 36, "c2": 28, "c3": 18, "c4": 6}'::jsonb, 88.00, '77777777-7777-7777-7777-777777777777')
ON CONFLICT (submission_id, rubric_id) DO NOTHING;
