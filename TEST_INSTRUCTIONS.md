# Test Suite Instructions

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/cs1060f25/autograder-project
cd autograder-project
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Tests

**Run all tests (unit + integration):**
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

**Note**: These commands are configured to run ONLY the test suite files in `src/__tests__/test_suite/`, not all tests in the project. 

---

## 📁 Test File Structure

```
src/__tests__/test_suite/
├── unit-tests.test.ts          # 25 unit test cases (5 modules)
└── integration-tests.test.ts   # 10 integration test cases (2 workflows)
```

---

**Last Updated**: December 2025  
**Test Framework**: Jest  
**Total Tests**: 35 test cases (25 unit + 10 integration)
