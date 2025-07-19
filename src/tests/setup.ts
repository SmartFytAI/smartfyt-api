import { beforeAll, afterAll, vi } from 'vitest';

// Set test environment variables
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'file:./test.db';
  process.env.KINDE_ISSUER_URL = 'https://test.kinde.com';
  process.env.KINDE_CLIENT_ID = 'test-client-id';
  process.env.LOG_LEVEL = 'silent';
  
  // Mock console.log to reduce noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
}); 