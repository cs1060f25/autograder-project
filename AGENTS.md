# AGENTS.md 

## Project Overview

This is an **AI-assisted autograder platform** designed to accelerate grading and increase accuracy for educational institutions. The platform enables instructors to create courses and assignments, TAs to grade submissions, and students to submit their work and receive feedback.

## Key Features

### User Roles

Users can authenticate as an instructor, TA, or student. Each role has a different set of permissions and capabilities.

1. **Instructor**

   - Create and manage courses
   - Create assignments with rubrics
   - Enroll students and assign TAs
   - Grade submissions
   - View course analytics
   - Manage regrade requests

2. **Teaching Assistant (TA)**

   - View assigned courses
   - Grade student submissions
   - Provide feedback
   - View pending grading queue

3. **Student**
   - View enrolled courses
   - Submit assignments
   - View grades and feedback
   - Request regrades

### Database Schema

The application uses Supabase with the following key tables. Use the Supabase MCP to view the database schema and update RLS policies as needed.

- `users` - User profiles with roles
- `courses` - Course information
- `assignments` - Assignment details
- `submissions` - Student submissions
- `rubrics` - Grading criteria
- `rubric_scores` - Individual rubric scores
- `course_enrollments` - Student-course relationships
- `course_ta_assignments` - TA-course relationships
- `regrade_requests` - Regrade request workflow

All tables have Row Level Security (RLS) policies enforcing role-based access control.


## Testing Instructions

### Continuous Integration Plan

- Run unit tests on every push/PR
- Run E2E tests on pull requests
- Run linters and type checking
- Build the application to catch build errors

### Running Tests

#### Unit and Integration Tests (Jest)

Run all unit and integration tests:

```bash
npm test
```

Run tests in watch mode (for development):

```bash
npm run test:watch
```

Run tests with coverage report:

```bash
npm run test:coverage
```

Run only integration tests:

```bash
npm run test:integration
```

#### End-to-End Tests (Playwright)

Run all E2E tests:

```bash
npm run test:e2e
```

Run E2E tests with UI mode (interactive):

```bash
npm run test:e2e:ui
```

### Running Linters and Static Analysis

#### TypeScript Type Checking

Check for type errors:

```bash
npx tsc --noEmit
```

This will validate all TypeScript files without generating output.

#### ESLint (via Next.js)

```bash
npm run lint
```

**Note**: If a `lint` script is not in `package.json`, Next.js provides it by default. You can also run:

```bash
npx next lint
```

#### Build Check

Verify the application builds successfully:

```bash
npm run build
```

This will catch:

- TypeScript errors
- Import/export issues
- Build-time errors
- Missing dependencies

### When to Update Tests

**You SHOULD update tests when:**

1. **Adding new features**: Create new test files for new functionality

   - New components → component tests
   - New server actions → action tests
   - New API routes → integration tests
   - New user flows → E2E tests

2. **Modifying existing behavior**: Update corresponding tests to reflect new behavior

   - Changed component props → update component tests
   - Modified business logic → update unit tests
   - Changed API contracts → update integration tests

3. **Fixing bugs**: Add regression tests to prevent the bug from recurring

   - Create a test that reproduces the bug
   - Fix the bug
   - Verify the test passes

**CRITICAL**: **Do NOT modify existing tests unless explicitly requested by the user.**
