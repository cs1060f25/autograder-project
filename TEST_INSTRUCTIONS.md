# Test Suite Instructions

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd autograder-project
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Tests
```bash
npm test
```

That's it! The test suite will run automatically.

**Note**: `npm test` is configured to run ONLY the test suite file (`test-suite.test.ts`), not all tests in the project. This ensures you're running exactly the 35 tests required for the assignment.

---

## 📋 Test Suite Overview

This test suite contains **35 test cases** covering both unit tests and integration tests.

### Unit Tests (25 test cases)
Tests individual functions with specific inputs and expected outputs:

1. **Date Utilities** (5 tests) - `formatDistanceToNow()`
   - Tests relative time formatting (just now, minutes ago, hours ago, etc.)

2. **Phone Utilities** (5 tests) - `validateE164PhoneNumber()`
   - Tests phone number validation in E.164 format

3. **User Utilities** (5 tests) - `getDashboardPath()`, `hasRole()`
   - Tests user role management and dashboard routing

4. **Grading Statistics** (5 tests) - `computeStatistics()`
   - Tests statistical calculations (average, median, min, max, distribution)

5. **Utility Functions** (5 tests) - `cn()`
   - Tests className merging utility

### Integration Tests (10 test cases)
Tests complete system workflows:

1. **Regrade Request Workflow** (5 tests)
   - Student submits regrade request
   - TA/Instructor resolves request
   - Grade recalculation
   - Duplicate prevention
   - Audit trail

2. **Notification System** (5 tests)
   - Email notifications
   - SMS notifications with consent
   - Notification logging
   - Error handling

---

## 📊 Expected Output

When you run `npm test`, you should see:

```
PASS  src/__tests__/test-suite.test.ts
  UNIT TESTS
    1. Date Utilities - formatDistanceToNow()
      ✓ should return "just now" for current time
      ✓ should return "5 minutes ago" for 5 minutes in the past
      ✓ should return "3 hours ago" for 3 hours in the past
      ✓ should return "2 days ago" for 2 days in the past
      ✓ should return "2 weeks ago" for 14 days in the past
    2. Phone Utilities - validateE164PhoneNumber()
      ✓ should validate correct E.164 format: +14155552671
      ✓ should accept phone numbers with whitespace: +1 415 555 2671
      ✓ should reject empty phone numbers
      ✓ should reject phone numbers without + prefix: 14155552671
      ✓ should reject phone numbers with non-digits: +1-415-555-2671
    3. User Utilities - getDashboardPath() and hasRole()
      ✓ should return /dashboard/student for student role
      ✓ should return /dashboard/ta for TA role
      ✓ should return /dashboard/instructor for instructor role
      ✓ should return true when user has required role
      ✓ should return false when user does not have required role
    4. Grading Statistics - computeStatistics()
      ✓ should return zero statistics for empty array
      ✓ should calculate average: (80+90+70)/3 = 80
      ✓ should calculate median for odd count: [70, 80, 90] = 80
      ✓ should find min=55 and max=95
      ✓ should calculate score distribution correctly
    5. Utility Functions - cn()
      ✓ should merge class names: "class1 class2 class3"
      ✓ should handle conditional: cn("base", true && "active")
      ✓ should filter false/null/undefined
      ✓ should return empty string for no input
      ✓ should handle single class
  INTEGRATION TESTS
    1. Regrade Request Workflow
      ✓ should allow student to submit regrade request with all required fields
      ✓ should allow TA to resolve request with approval
      ✓ should prevent duplicate pending requests for same rubric item
      ✓ should recalculate grade when request is approved
      ✓ should maintain audit trail of grade changes
    2. Notification System Workflow
      ✓ should send email notification when regrade is approved
      ✓ should send SMS if student has phone number and consent
      ✓ should not send SMS without consent
      ✓ should log notification in database
      ✓ should handle notification failures gracefully

Test Suites: 1 passed, 1 total
Tests:       35 passed, 35 total
Time:        0.5s
```

---

## ✅ Success Criteria

Your test suite is working correctly if:
- ✅ All 35 tests pass
- ✅ No errors or failures
- ✅ Tests complete in under 5 seconds

---

## 🔧 Troubleshooting

### Tests Fail with "Cannot find module"
```bash
npm test -- --clearCache
npm install
npm test
```

### Port Already in Use
Not applicable - these tests don't require a running server.

---

## 📁 Test File Location

All tests are in a single file:
```
src/__tests__/test-suite.test.ts
```

---

## 🎯 What's Being Tested

### Unit Tests
Each unit test provides:
- **Specific input** to a function
- **Expected deterministic output**
- **Multiple test cases** per function

Example:
```typescript
// Input: current date
formatDistanceToNow(new Date())
// Expected output: "just now"

// Input: date 5 minutes ago
formatDistanceToNow(date5MinutesAgo)
// Expected output: "5 minutes ago"
```

### Integration Tests
Each integration test exercises:
- **Complete workflows** across multiple components
- **System behavior** rather than individual functions
- **Real-world scenarios** like submitting and resolving regrade requests

Example:
```typescript
// Workflow: Student submits regrade request
1. Create request with required fields
2. Verify status is "pending"
3. TA reviews and approves
4. Grade is recalculated
5. Audit trail is created
```

---

## Test Details

### Unit Tests

#### 1. Date Utilities (`date-utils.test.ts`)
**Module**: `src/lib/date-utils.ts`  
**Function Tested**: `formatDistanceToNow(date: Date): string`

**Test Cases**:
- Returns "just now" for dates within last 60 seconds
- Returns minutes ago for dates within last hour
- Returns hours ago for dates within last 24 hours
- Returns days ago for dates within last week
- Returns weeks ago for dates within last month
- Returns months ago for dates within last year
- Returns years ago for dates over a year old
- Handles singular vs plural correctly (1 minute vs 2 minutes)
- Handles boundary cases

**Input/Output Examples**:
```javascript
formatDistanceToNow(new Date()) // "just now"
formatDistanceToNow(5 minutes ago) // "5 minutes ago"
formatDistanceToNow(3 hours ago) // "3 hours ago"
formatDistanceToNow(2 days ago) // "2 days ago"
```

---

#### 2. Phone Utilities (`phone-utils.test.ts`)
**Module**: `src/lib/phone-utils.ts`  
**Functions Tested**: 
- `validateE164PhoneNumber(phoneNumber: string)`
- `formatPhoneNumber(phoneNumber: string, countryCode: string)`
- `COUNTRY_CODES` constant

**Test Cases**:
- Validates correct E.164 format (+14155552671)
- Accepts phone numbers with whitespace
- Rejects empty phone numbers
- Rejects phone numbers without + prefix
- Rejects phone numbers with non-digit characters
- Rejects phone numbers that are too short or too long
- Formats phone numbers for different countries
- Returns original number for unknown country code

**Input/Output Examples**:
```javascript
validateE164PhoneNumber('+14155552671') 
// { isValid: true }

validateE164PhoneNumber('14155552671') 
// { isValid: false, error: "Phone number must start with +" }

formatPhoneNumber('+14155552671', 'US') 
// "(415) 555-2671"
```

---

#### 3. User Utilities (`user-utils.test.ts`)
**Module**: `src/lib/user-utils.ts`  
**Functions Tested**:
- `getDashboardPath(role: UserRole): Promise<string>`
- `hasRole(userProfile: UserProfile, requiredRole: UserRole): Promise<boolean>`
- `canAccessDashboard(userProfile: UserProfile, dashboardRole: UserRole): Promise<boolean>`

**Test Cases**:
- Returns correct dashboard path for each role (student/ta/instructor)
- Returns default path for unknown role
- Correctly checks if user has required role
- Correctly checks if user can access specific dashboard
- Prevents unauthorized dashboard access

**Input/Output Examples**:
```javascript
getDashboardPath('student') // "/dashboard/student"
getDashboardPath('ta') // "/dashboard/ta"
getDashboardPath('instructor') // "/dashboard/instructor"

hasRole({ role: 'student' }, 'student') // true
hasRole({ role: 'student' }, 'instructor') // false

canAccessDashboard({ role: 'student' }, 'student') // true
canAccessDashboard({ role: 'student' }, 'ta') // false
```

---

#### 4. Grading Statistics (`grading-statistics.test.ts`)
**Module**: `src/lib/grading-statistics.ts`  
**Function Tested**: `computeStatistics(assignmentId: string, submissions: Submission[])`

**Test Cases**:
- Returns zero statistics for empty submissions
- Calculates correct average for graded submissions
- Calculates correct median for odd and even number of scores
- Calculates correct min and max scores
- Calculates correct score distribution (0-59, 60-69, 70-79, 80-89, 90-100)
- Ignores non-graded submissions
- Rounds average and median to 2 decimal places
- Handles boundary scores correctly

**Input/Output Examples**:
```javascript
computeStatistics('assignment-123', [
  { id: '1', grade: 80, status: 'graded' },
  { id: '2', grade: 90, status: 'graded' },
  { id: '3', grade: 70, status: 'graded' },
])
// {
//   assignmentId: 'assignment-123',
//   totalSubmissions: 3,
//   gradedSubmissions: 3,
//   averageScore: 80,
//   medianScore: 80,
//   minScore: 70,
//   maxScore: 90,
//   scoreDistribution: [...]
// }
```

---

#### 5. Utility Functions (`utils.test.ts`)
**Module**: `src/lib/utils.ts`  
**Function Tested**: `cn(...inputs: ClassValue[])`

**Test Cases**:
- Merges multiple class names
- Handles conditional classes
- Filters out false/null/undefined values
- Handles Tailwind class conflicts (keeps last one)
- Handles empty input
- Handles array of classes
- Handles object with conditional classes
- Merges complex Tailwind classes with modifiers

**Input/Output Examples**:
```javascript
cn('class1', 'class2') // "class1 class2"
cn('base', true && 'active') // "base active"
cn('px-2', 'px-4') // "px-4" (conflict resolved)
cn({ 'class1': true, 'class2': false }) // "class1"
```

---

### Integration Tests

#### 1. Regrade Workflow (`regrade-workflow.test.ts`)
**System Components Tested**: Regrade request submission, resolution, and grade recalculation

**Test Scenarios**:
1. **Complete Regrade Flow**
   - Student submits regrade request for graded submission
   - Request is stored with pending status
   - Audit metadata is captured

2. **Resolution Workflow**
   - TA/Instructor reviews pending request
   - Makes decision (approve/reject)
   - Provides resolution notes
   - Updates grade if approved

3. **Duplicate Prevention**
   - Prevents duplicate pending requests for same rubric item
   - Allows new request after previous is resolved

4. **Grade Recalculation**
   - Recalculates grade when regrade is approved
   - Updates submission grade
   - Maintains audit trail

5. **Input Validation**
   - Validates student explanation is required
   - Rejects empty or whitespace-only explanations
   - Enforces character limit

6. **Access Control**
   - Students can only view their own requests
   - TAs can view requests for their courses
   - Instructors can view all course requests

**Expected Behavior**:
- Regrade requests follow complete lifecycle: submit → pending → resolve → approved/rejected
- Grade changes are tracked in audit log
- Unique constraint prevents duplicate pending requests
- Role-based access control is enforced

---

#### 2. Notification System (`notification-system.test.ts`)
**System Components Tested**: Notification generation, delivery, and logging

**Test Scenarios**:
1. **Regrade Resolution Notifications**
   - Sends email when regrade is approved
   - Sends email when regrade is denied
   - Sends SMS if student has phone number and consent
   - Includes audit context in notification

2. **Assignment Notifications**
   - Notifies students when assignment is published
   - Notifies students when assignment is due soon
   - Targets only students without submissions

3. **Grading Notifications**
   - Notifies student when submission is graded
   - Includes grade in notification

4. **Error Handling**
   - Logs failed notifications
   - Continues operation even if notification fails
   - Uses mock mode when credentials not configured

5. **Notification Logging**
   - Records all notifications in database
   - Tracks delivery status
   - Maintains notification history

**Expected Behavior**:
- Notifications are sent via email and SMS (if configured)
- Notifications include relevant context and details
- Failed notifications are logged but don't block operations
- All notifications are persisted in database
- Mock mode works when credentials are not provided

---

## Understanding Test Results

### Successful Test Output
```
PASS  src/__tests__/unit/date-utils.test.ts
  Date Utilities - Unit Tests
    formatDistanceToNow
      ✓ should return "just now" for dates within last 60 seconds (5ms)
      ✓ should return minutes ago for dates within last hour (2ms)
      ✓ should return hours ago for dates within last 24 hours (1ms)
      ...

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

### Failed Test Output
```
FAIL  src/__tests__/unit/date-utils.test.ts
  Date Utilities - Unit Tests
    formatDistanceToNow
      ✕ should return "just now" for dates within last 60 seconds (10ms)

  ● Date Utilities - Unit Tests › formatDistanceToNow › should return "just now"

    expect(received).toBe(expected)

    Expected: "just now"
    Received: "1 minute ago"
```

---

## Coverage Report

After running `npm run test:coverage`, open the coverage report:
```bash
open coverage/lcov-report/index.html
```

The report shows:
- **Statements**: Percentage of code statements executed
- **Branches**: Percentage of conditional branches tested
- **Functions**: Percentage of functions called
- **Lines**: Percentage of lines executed

---

## Troubleshooting

### Tests Fail with "Cannot find module"
```bash
# Clear Jest cache
npm test -- --clearCache
```

### Tests Timeout
Increase timeout in test file:
```javascript
jest.setTimeout(10000); // 10 seconds
```

### Environment Variables Not Loaded
Ensure `.env.local` exists and contains required variables.

### Database Connection Errors
Tests use mock data and don't require real database connection. If you see database errors, check that mock environment variables are set.

---

## Test Statistics

- **Total Test Files**: 7 (5 unit + 2 integration)
- **Total Test Cases**: 50+ individual test cases
- **Estimated Runtime**: 5-10 seconds
- **Coverage Target**: 70%+

---

## Continuous Integration

To run tests in CI/CD pipeline:
```bash
# Run all tests with coverage
npm run test:coverage

# Check exit code
echo $?  # Should be 0 if all tests pass
```

---

## Additional Resources

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Testing Best Practices**: See `AGENTS.md` for project guidelines
- **Project Structure**: See `README.md` for overview

---

## Success Criteria

Your test suite is working correctly if:
- ✅ All unit tests pass (5 test files)
- ✅ All integration tests pass (2 test files)
- ✅ No TypeScript errors
- ✅ Coverage is above 70%
- ✅ Tests complete in under 30 seconds

---

**Last Updated**: December 2025  
**Test Framework**: Jest  
**Total Tests**: 50+ test cases across 7 files
