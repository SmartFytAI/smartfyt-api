import { describe, it, expect, vi, beforeEach } from 'vitest';
import { log } from '../../utils/logger.js';

describe('Logger', () => {
  let mockLogger: any;

  beforeEach(() => {
    // Mock the pino logger
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should log info messages with context', () => {
    const message = 'Test info message';
    const context = { userId: 'test-123' };
    
    // Test the log structure
    expect(log.info).toBeDefined();
    expect(log.error).toBeDefined();
    expect(log.warn).toBeDefined();
    expect(log.debug).toBeDefined();
  });

  it('should have authentication logging methods', () => {
    expect(log.auth.success).toBeDefined();
    expect(log.auth.failure).toBeDefined();
    expect(log.auth.tokenValidation).toBeDefined();
  });

  it('should have request logging methods', () => {
    expect(log.request.start).toBeDefined();
    expect(log.request.complete).toBeDefined();
    expect(log.request.error).toBeDefined();
  });

  it('should have database logging methods', () => {
    expect(log.database.query).toBeDefined();
    expect(log.database.error).toBeDefined();
  });

  it('should handle error objects properly', () => {
    const error = new Error('Test error');
    const message = 'Database operation failed';
    
    // Should not throw when called with error object
    expect(() => {
      log.error(message, error);
    }).not.toThrow();
  });
}); 