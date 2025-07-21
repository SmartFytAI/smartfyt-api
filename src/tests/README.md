# 🧪 SmartFyt API Testing Suite

## Overview

This testing suite provides comprehensive unit tests for the SmartFyt API layer, focusing on the most crucial functionality including user management, journals, teams, quests, leaderboards, and dashboard features.

## 🏗️ Testing Architecture

### Core Testing Stack
- **Vitest** - Fast test runner with native TypeScript support
- **Fastify** - HTTP server for testing API endpoints
- **Prisma Mocking** - **100% Mocked Database Operations** (No Real DB Connections)
- **TypeScript** - Full type safety for tests

### 🎯 Mock-First Philosophy
- **No Real Database Connections**: All tests use mocked Prisma operations
- **Fast Execution**: Tests run quickly without external dependencies
- **Reliable**: Deterministic tests that don't depend on database state
- **Isolated**: Each test is completely independent

### Test Structure
```
src/tests/
├── setup.ts                    # Global test configuration
├── utils/
│   └── test-utils.ts          # Shared test utilities and mocks
├── routes/                     # Route-specific test files
│   ├── userManagement.test.ts  # User management tests
│   ├── journals.test.ts        # Journal functionality tests
│   ├── teams.test.ts          # Team management tests
│   ├── questManagement.test.ts # Quest system tests
│   ├── leaderboard.test.ts     # Leaderboard tests
│   ├── dashboard.test.ts       # Dashboard tests
│   ├── health.test.ts          # Health endpoint tests
│   └── sports.test.ts          # Sports endpoint tests
└── README.md                   # This file
```

## 🚀 Quick Start

### Install Dependencies
```bash
cd smartfyt-api && flox activate -- npm install
```

### Run All Tests
```bash
flox activate -- npm test:run
```

### Run Tests in Watch Mode
```bash
flox activate -- npm test:watch
```

### Run Tests with UI
```bash
flox activate -- npm test:ui
```

### Run Tests with Coverage
```bash
flox activate -- npm test:coverage
```

### Verify Database Mocking
```bash
flox activate -- npm run test:verify-mocking
```

## 📋 Test Suites

### 1. User Management Tests (`userManagement.test.ts`)
**Coverage**: User CRUD operations, data retrieval, and user snapshots

**Key Test Cases**:
- ✅ User creation with validation
- ✅ User data retrieval and transformation
- ✅ User snapshot data aggregation
- ✅ Error handling for missing users
- ✅ Database error handling
- ✅ Duplicate email prevention

**Endpoints Tested**:
- `GET /users/:userId/data`
- `POST /users`
- `GET /users/:userId/snapshot`

### 2. Journal Tests (`journals.test.ts`)
**Coverage**: Journal creation, retrieval, and date-based queries

**Key Test Cases**:
- ✅ Journal creation with validation
- ✅ Paginated journal retrieval
- ✅ Date-based journal queries
- ✅ Journal dates aggregation
- ✅ Error handling for missing journals
- ✅ Database error handling

**Endpoints Tested**:
- `GET /users/:userId/journals`
- `GET /users/:userId/journals/dates`
- `GET /users/:userId/journals/date/:date`
- `POST /journals`

### 3. Team Tests (`teams.test.ts`)
**Coverage**: Team management, member operations, and team data

**Key Test Cases**:
- ✅ Team creation and management
- ✅ User team membership
- ✅ Team member role updates
- ✅ Member addition/removal
- ✅ Team data retrieval
- ✅ Error handling for team operations

**Endpoints Tested**:
- `GET /users/:userId/teams`
- `GET /teams`
- `GET /teams/:teamId/members`
- `POST /teams`
- `POST /teams/:teamId/members`
- `PUT /teams/:teamId/members/:userId`
- `DELETE /teams/:teamId/members/:userId`

### 4. Quest Management Tests (`questManagement.test.ts`)
**Coverage**: Quest completion, assignment, and user stats

**Key Test Cases**:
- ✅ Quest completion with point calculation
- ✅ User stat updates and level progression
- ✅ Quest assignment and validation
- ✅ Notes and character limits
- ✅ Error handling for invalid quests
- ✅ Database transaction handling

**Endpoints Tested**:
- `POST /users/:userId/quests/complete`
- `GET /users/:userId/quests`
- `POST /users/:userId/quests/assign`
- `GET /users/:userId/stats`

### 5. Leaderboard Tests (`leaderboard.test.ts`)
**Coverage**: Team, school, and global leaderboards

**Key Test Cases**:
- ✅ Team leaderboard ranking
- ✅ School leaderboard aggregation
- ✅ Global leaderboard sorting
- ✅ User team leaderboards
- ✅ Point calculation and ranking
- ✅ Error handling for missing data

**Endpoints Tested**:
- `GET /teams/:teamId/leaderboard`
- `GET /users/:userId/school/leaderboard`
- `GET /users/:userId/teams/leaderboard`
- `GET /leaderboard/global`

### 6. Dashboard Tests (`dashboard.test.ts`)
**Coverage**: Dashboard data aggregation and metrics

**Key Test Cases**:
- ✅ Comprehensive dashboard data
- ✅ User metrics calculation
- ✅ Health data aggregation
- ✅ Multi-source data combination
- ✅ Empty data handling
- ✅ Performance optimization

**Endpoints Tested**:
- `GET /users/:userId/dashboard`
- `GET /users/:userId/metrics`
- `GET /users/:userId/health`

## 🛠️ Test Utilities

### 🎯 Mock-First Database Strategy
All tests use **100% mocked database operations** to ensure:
- **No Real Database Connections**: Tests never connect to real databases
- **Fast Execution**: Tests run quickly without external dependencies  
- **Reliable Results**: Deterministic tests that don't depend on database state
- **Complete Isolation**: Each test is completely independent

### Mock Data Factories
The `test-utils.ts` file provides factory functions for creating consistent mock data:

```typescript
import { 
  createMockUser, 
  createMockJournal, 
  createMockTeam,
  createMockQuest,
  createMockUserStat 
} from '../utils/test-utils';

// Create mock data with defaults
const user = createMockUser();

// Create mock data with overrides
const customUser = createMockUser({ 
  firstName: 'Jane', 
  email: 'jane@example.com' 
});
```

### Mock Prisma Setup
```typescript
import { getMockPrisma, resetMockPrisma, setupTestApp } from '../utils/test-utils';

// Get the globally mocked prisma instance
const mockPrisma = getMockPrisma();

// Reset mocks in beforeEach for clean state
beforeEach(() => {
  resetMockPrisma();
});

// Setup test app (prisma is already mocked globally)
await setupTestApp(app);
```

### Response Helpers
```typescript
import { expectErrorResponse, expectSuccessResponse } from '../utils/test-utils';

// Test error responses
expectErrorResponse(response, 404, 'User not found');

// Test success responses
const payload = expectSuccessResponse(response, 200);
```

## 📊 Coverage Goals

### Target Coverage
- **Statements**: 85%+
- **Branches**: 80%+
- **Functions**: 90%+
- **Lines**: 85%+

### Critical Areas (90%+ Coverage)
- **User Management** - Security and data integrity
- **Quest System** - Point calculation and progression
- **Team Management** - Member operations and permissions
- **Journal System** - Data persistence and retrieval
- **Leaderboard** - Ranking algorithms and aggregation

## 🔧 Configuration

### Vitest Config
The testing is configured in `vitest.config.ts` with:
- Node.js environment
- Global test setup
- Coverage reporting
- Path aliases

### Test Setup
The `setup.ts` file configures:
- Environment variables
- Prisma mocking
- Console output suppression
- Global test utilities

## 🚨 Testing Best Practices

### 1. Test Organization
- **Group related tests** in `describe` blocks
- **Use descriptive test names** that explain behavior
- **Follow AAA pattern**: Arrange, Act, Assert
- **Keep tests focused** - one assertion per test when possible

### 2. Mocking Strategy
- **Mock Prisma at the module level** for consistent behavior
- **Use factory functions** for consistent mock data
- **Reset mocks** between tests to prevent interference
- **Test error conditions** with realistic error scenarios

### 3. API Testing
- **Test HTTP status codes** and response formats
- **Validate request/response schemas**
- **Test error handling** and edge cases
- **Verify database interactions** through mocks

### 4. Data Validation
- **Test required field validation**
- **Test data type validation**
- **Test business rule validation**
- **Test constraint violations**

## 🎯 Running Specific Tests

### Run Individual Test Suites
```bash
# User management tests
flox activate -- npm run test:user-management

# Journal tests
flox activate -- npm run test:journals

# Team tests
flox activate -- npm run test:teams

# Quest tests
flox activate -- npm run test:quests

# Leaderboard tests
flox activate -- npm run test:leaderboard

# Dashboard tests
flox activate -- npm run test:dashboard
```

### Run Tests with Coverage
```bash
# All tests with coverage
flox activate -- npm run test:coverage

# Specific suite with coverage
flox activate -- npm run test:user-management -- --coverage
```

### Run Tests in Development
```bash
# Watch mode for development
flox activate -- npm run test:watch

# UI mode for interactive testing
flox activate -- npm run test:ui
```

## 🔍 Debugging Tests

### 1. Using Vitest UI
```bash
npm run test:ui
```
- Interactive test runner
- Real-time feedback
- Debug mode support

### 2. Debug Mode
```typescript
it('debug test', () => {
  debugger; // Will pause execution in debug mode
  // Test code here
});
```

### 3. Verbose Output
```bash
npm run test:run -- --verbose
```

## 📈 Continuous Integration

### GitHub Actions Example
```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run type-check
```

## 🎯 Next Steps

1. **Run initial tests** to verify setup
2. **Review coverage reports** to identify gaps
3. **Add integration tests** for complex workflows
4. **Implement performance tests** for critical endpoints
5. **Add API contract tests** for external integrations

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Fastify Testing](https://www.fastify.io/docs/latest/Guides/Testing/)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)
- [API Testing Best Practices](https://martinfowler.com/articles/microservice-testing/)

---

**Remember**: Good tests are like good documentation - they help you understand how your API should work and catch regressions before they reach users! 🧪✨ 