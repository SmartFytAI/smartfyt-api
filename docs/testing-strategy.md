# 🧪 SmartFyt API Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the SmartFyt API, ensuring **100% mock database usage** during tests while maintaining high test coverage and reliability.

## 🎯 Testing Philosophy

### Core Principles
1. **No Real Database Connections**: All tests must use mocked database operations
2. **Fast Execution**: Tests should run quickly without external dependencies
3. **Reliable**: Tests should be deterministic and not flaky
4. **Comprehensive**: Cover all critical business logic and edge cases
5. **Maintainable**: Easy to understand, modify, and extend

### Testing Pyramid
```
    🔺 E2E Tests (Few)
   🔺🔺 Integration Tests (Some)
  🔺🔺🔺 Unit Tests (Many)
```

## 🏗️ Architecture

### Mock Strategy
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Test Files    │───▶│  Test Utils     │───▶│  Global Mock    │
│                 │    │                 │    │                 │
│ - userManagement│    │ - Mock Factories│    │ - Prisma Mock   │
│ - journals      │    │ - Helpers       │    │ - No Real DB    │
│ - teams         │    │ - Scenarios     │    │ - Fast Execution│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components

1. **Global Mock Setup** (`src/tests/setup.ts`)
   - Mocks Prisma module before any imports
   - Sets test environment variables
   - Ensures no real database connections

2. **Test Utilities** (`src/tests/utils/test-utils.ts`)
   - Mock data factories
   - Helper functions for common test scenarios
   - Response validation helpers

3. **Route Tests** (`src/tests/routes/`)
   - Individual test files for each route group
   - Focused on business logic testing
   - Comprehensive error case coverage

## 🚀 Implementation Guide

### 1. Test Setup Pattern

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify from 'fastify';
import userRoutes from '../../routes/userManagement.js';
import { 
  getMockPrisma, 
  resetMockPrisma,
  createMockUser, 
  setupTestApp, 
  expectErrorResponse, 
  expectSuccessResponse 
} from '../utils/test-utils.js';

describe('User Management Routes', () => {
  let app: FastifyInstance;
  let mockPrisma: ReturnType<typeof getMockPrisma>;

  beforeEach(async () => {
    // Reset all mocks to ensure clean state
    vi.clearAllMocks();
    resetMockPrisma();
    
    // Create fresh Fastify instance
    app = Fastify();
    
    // Get the mocked prisma instance
    mockPrisma = getMockPrisma();

    // Setup test app
    await setupTestApp(app);

    // Register routes
    await app.register(userRoutes);
    await app.ready();
  });

  // Test cases here...
});
```

### 2. Mock Data Factories

```typescript
// Create mock data with defaults
const user = createMockUser();

// Create mock data with overrides
const customUser = createMockUser({ 
  firstName: 'Jane', 
  email: 'jane@example.com' 
});

// Create related mock data
const journal = createMockJournal({ authorID: user.id });
```

### 3. Database Mocking Patterns

```typescript
// Success case
mockPrisma.user.findUnique.mockResolvedValue(createMockUser());

// Not found case
mockPrisma.user.findUnique.mockResolvedValue(null);

// Error case
mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

// Empty result case
mockPrisma.journal.findMany.mockResolvedValue([]);
```

### 4. Response Validation

```typescript
// Test success response
const response = await app.inject({
  method: 'GET',
  url: '/users/user123/data',
});

const payload = expectSuccessResponse(response);
expect(payload).toEqual(expectedData);

// Test error response
expectErrorResponse(response, 404, 'User not found');
```

## 📋 Test Categories

### 1. Unit Tests (Route Level)
**Purpose**: Test individual route handlers and business logic

**Coverage**:
- ✅ Input validation
- ✅ Business logic processing
- ✅ Response formatting
- ✅ Error handling
- ✅ Database operation mocking

**Example**:
```typescript
describe('GET /users/:userId/data', () => {
  it('should return user data when user exists', async () => {
    const mockUser = createMockUser();
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const response = await app.inject({
      method: 'GET',
      url: '/users/user123/data',
    });

    const payload = expectSuccessResponse(response);
    expect(payload).toEqual({
      id: 'user123',
      given_name: 'John',
      family_name: 'Doe',
      email: 'john@example.com',
    });
  });
});
```

### 2. Integration Tests (Service Level)
**Purpose**: Test interactions between multiple components

**Coverage**:
- ✅ Route registration
- ✅ Middleware integration
- ✅ Plugin interactions
- ✅ Error propagation

### 3. Contract Tests (API Level)
**Purpose**: Ensure API contracts are maintained

**Coverage**:
- ✅ Request/response schemas
- ✅ HTTP status codes
- ✅ Error message formats
- ✅ Content-Type headers

## 🛠️ Testing Tools & Configuration

### Vitest Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
      ],
    },
  },
});
```

### Environment Variables
```bash
# Test environment variables (set in setup.ts)
NODE_ENV=test
DATABASE_URL=file:./test.db
LOG_LEVEL=silent
```

### Mock Verification
```typescript
// Verify mocks were called correctly
expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
  where: { id: 'user123' },
});

expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
```

## 📊 Coverage Goals

### Target Coverage
- **Statements**: 85%+
- **Branches**: 80%+
- **Functions**: 90%+
- **Lines**: 85%+

### Critical Areas (90%+ Coverage)
- **User Management**: Security and data integrity
- **Quest System**: Point calculation and progression
- **Team Management**: Member operations and permissions
- **Journal System**: Data persistence and retrieval
- **Leaderboard**: Ranking algorithms and aggregation

## 🔍 Test Scenarios

### Common Test Patterns

1. **Happy Path Testing**
```typescript
it('should successfully complete the operation', async () => {
  // Arrange
  const mockData = createMockUser();
  mockPrisma.user.findUnique.mockResolvedValue(mockData);
  
  // Act
  const response = await app.inject({
    method: 'GET',
    url: '/users/user123/data',
  });
  
  // Assert
  const payload = expectSuccessResponse(response);
  expect(payload).toEqual(expectedData);
});
```

2. **Error Handling Testing**
```typescript
it('should handle database errors gracefully', async () => {
  // Arrange
  mockPrisma.user.findUnique.mockRejectedValue(new Error('DB Error'));
  
  // Act
  const response = await app.inject({
    method: 'GET',
    url: '/users/user123/data',
  });
  
  // Assert
  expectErrorResponse(response, 500, 'Failed to fetch user data');
});
```

3. **Validation Testing**
```typescript
it('should validate required fields', async () => {
  // Act
  const response = await app.inject({
    method: 'POST',
    url: '/users',
    payload: { /* missing required fields */ },
  });
  
  // Assert
  expectErrorResponse(response, 400, 'Validation failed');
});
```

4. **Edge Case Testing**
```typescript
it('should handle empty results', async () => {
  // Arrange
  mockPrisma.journal.findMany.mockResolvedValue([]);
  
  // Act
  const response = await app.inject({
    method: 'GET',
    url: '/users/user123/journals',
  });
  
  // Assert
  const payload = expectSuccessResponse(response);
  expect(payload.journals).toEqual([]);
  expect(payload.pagination.total).toBe(0);
});
```

## 🚨 Best Practices

### 1. Test Organization
- **Group related tests** in `describe` blocks
- **Use descriptive test names** that explain behavior
- **Follow AAA pattern**: Arrange, Act, Assert
- **Keep tests focused** - one assertion per test when possible

### 2. Mock Management
- **Reset mocks** between tests to prevent interference
- **Use factory functions** for consistent mock data
- **Verify mock calls** to ensure correct database operations
- **Test error conditions** with realistic error scenarios

### 3. Data Management
- **Use factory functions** for creating test data
- **Override only necessary fields** in test data
- **Create realistic data** that matches production schemas
- **Use consistent IDs** across related test data

### 4. Performance
- **Keep tests fast** by using mocks instead of real database
- **Avoid unnecessary setup** in test files
- **Use shared utilities** to reduce code duplication
- **Run tests in parallel** when possible

## 🔧 Debugging Tests

### 1. Mock Inspection
```typescript
// Check if mock was called
console.log('Mock calls:', mockPrisma.user.findUnique.mock.calls);

// Check mock implementation
console.log('Mock implementation:', mockPrisma.user.findUnique.getMockImplementation());
```

### 2. Response Debugging
```typescript
// Log full response for debugging
console.log('Response:', {
  statusCode: response.statusCode,
  headers: response.headers,
  payload: JSON.parse(response.payload),
});
```

### 3. Vitest UI
```bash
npm run test:ui
```
- Interactive test runner
- Real-time feedback
- Debug mode support

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
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 🎯 Migration Guide

### From Mixed Testing to Pure Mocking

1. **Update Test Setup**
   - Ensure `setup.ts` mocks Prisma globally
   - Remove any real database connections

2. **Update Test Files**
   - Replace `createMockPrisma()` with `getMockPrisma()`
   - Use `resetMockPrisma()` in `beforeEach`
   - Remove `setupTestApp(app, mockPrisma)` calls

3. **Verify Mocking**
   - Run tests with `--verbose` to see mock usage
   - Check that no real database connections are made
   - Verify all database operations are mocked

4. **Update Documentation**
   - Update README with new testing approach
   - Document mock patterns and best practices

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Fastify Testing](https://www.fastify.io/docs/latest/Guides/Testing/)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)
- [API Testing Best Practices](https://martinfowler.com/articles/microservice-testing/)

---

**Remember**: The goal is to have fast, reliable tests that give you confidence in your API without the complexity and slowness of real database connections! 🧪✨ 