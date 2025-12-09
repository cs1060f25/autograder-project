# Test Suite Instructions

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/cs1060f25/autograder-project
cd autograder-project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Obtain the environment variables by emailing us (jacksonmoody@college.harvard.edu, evanjiang@college.harvard.edu, johnho@college.harvard.edu, andrew_zhang@college.harvard.edu). Then paste them into a .env file in the root of the project.

### 4. Run Tests

**Run all Jest tests (unit + integration):**

```bash
npm test
```

**Run only unit tests (25 tests):**

```bash
npm run test:unit
```

**Run only integration tests (10 tests):**

```bash
npm run test:integration
```

**Run Playwright E2E tests:**

```bash
npm run test:e2e
```

**Run Playwright tests with UI mode (interactive):**

```bash
npm run test:e2e:ui
```

## Test File Structure

### Jest Tests (Unit & Integration)

```
src/__tests__/test_suite/
├── unit-tests.test.ts          # 25 unit test cases (5 modules)
└── integration-tests.test.ts   # 10 integration test cases (2 workflows)
```

### Playwright E2E Tests

```
src/__tests__/e2e/
├── auth-flow.spec.ts           # Authentication flow tests (OAuth, email signup/login)
├── course-navigation.spec.ts   # Course management tests (instructor & student)
├── logins.spec.ts              # Login/logout tests for all roles
└── test-helpers.ts             # Shared test utilities and helpers
```

## Test Summary

### Jest Tests

- **Framework**: Jest
- **Total Tests**: 35 test cases
  - Unit Tests: 25 tests (5 modules)
  - Integration Tests: 10 tests (2 workflows)

### Playwright E2E Tests

- **Framework**: Playwright
- **Test Files**: 3 spec files
  - `auth-flow.spec.ts` - Authentication workflows
  - `course-navigation.spec.ts` - Course navigation for instructors and students
  - `logins.spec.ts` - Login/logout for all roles

---

**Last Updated**: December 2025  
**Test Frameworks**: Jest (Unit/Integration), Playwright (E2E)
