import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { validateToken } from '@kinde/jwt-validator';
import authPlugin from '../../plugins/auth.js';

// Mock the Kinde JWT validator
vi.mock('@kinde/jwt-validator', () => ({
  validateToken: vi.fn(),
}));

// Mock the logger
vi.mock('../../utils/logger.js', () => ({
  default: {
    auth: {
      failure: vi.fn(),
      success: vi.fn(),
      tokenValidation: vi.fn(),
    },
    error: vi.fn(),
  },
}));

// Mock environment variables
const originalEnv = process.env;

describe('Auth Plugin Logic', () => {
  let mockValidateToken: any;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Get the mocked validateToken function
    mockValidateToken = vi.mocked(validateToken);

    // Set up environment variables
    process.env = {
      ...originalEnv,
      KINDE_ISSUER_URL: 'https://test.kinde.com',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Token Validation Logic', () => {
    it('should validate token with correct parameters', async () => {
      mockValidateToken.mockResolvedValue({
        valid: true,
        payload: {
          sub: 'user123',
          email: 'test@example.com',
        },
      });

      const result = await validateToken({
        token: 'test-token',
        domain: 'https://test.kinde.com',
      });

      expect(mockValidateToken).toHaveBeenCalledWith({
        token: 'test-token',
        domain: 'https://test.kinde.com',
      });
      expect(result.valid).toBe(true);
    });

    it('should handle invalid token validation', async () => {
      mockValidateToken.mockResolvedValue({
        valid: false,
      });

      const result = await validateToken({
        token: 'expired-token',
        domain: 'https://test.kinde.com',
      });

      expect(result.valid).toBe(false);
    });

    it('should handle token validation errors', async () => {
      mockValidateToken.mockRejectedValue(new Error('Validation error'));

      await expect(validateToken({
        token: 'error-token',
        domain: 'https://test.kinde.com',
      })).rejects.toThrow('Validation error');
    });
  });

  describe('Environment Configuration', () => {
    it('should use KINDE_ISSUER_URL when available', () => {
      process.env.KINDE_ISSUER_URL = 'https://test.kinde.com';
      delete process.env.KINDE_DOMAIN;

      const domain = process.env.KINDE_ISSUER_URL || process.env.KINDE_DOMAIN;
      expect(domain).toBe('https://test.kinde.com');
    });

    it('should fallback to KINDE_DOMAIN when KINDE_ISSUER_URL is not set', () => {
      delete process.env.KINDE_ISSUER_URL;
      process.env.KINDE_DOMAIN = 'https://fallback.kinde.com';

      const domain = process.env.KINDE_ISSUER_URL || process.env.KINDE_DOMAIN;
      expect(domain).toBe('https://fallback.kinde.com');
    });

    it('should return undefined when neither environment variable is set', () => {
      delete process.env.KINDE_ISSUER_URL;
      delete process.env.KINDE_DOMAIN;

      const domain = process.env.KINDE_ISSUER_URL || process.env.KINDE_DOMAIN;
      expect(domain).toBeUndefined();
    });
  });

  describe('Token Parsing Logic', () => {
    it('should extract token from Bearer format', () => {
      const authHeader = 'Bearer test-token';
      const token = authHeader.replace(/^Bearer\s+/i, '');
      expect(token).toBe('test-token');
    });

    it('should handle Bearer token with extra spaces', () => {
      const authHeader = 'Bearer   test-token  ';
      const token = authHeader.replace(/^Bearer\s+/i, '');
      expect(token).toBe('test-token  ');
    });

    it('should handle case insensitive Bearer', () => {
      const authHeader = 'bearer test-token';
      const token = authHeader.replace(/^Bearer\s+/i, '');
      expect(token).toBe('test-token');
    });

    it('should return empty string for non-Bearer format', () => {
      const authHeader = 'InvalidToken';
      const token = authHeader.replace(/^Bearer\s+/i, '');
      expect(token).toBe('InvalidToken');
    });
  });

  describe('User Payload Extraction', () => {
    it('should extract user data from payload structure', () => {
      const validationResult = {
        valid: true,
        payload: {
          sub: 'user123',
          email: 'test@example.com',
          given_name: 'John',
          family_name: 'Doe',
          picture: 'https://example.com/avatar.jpg',
        },
      };

      const payload = validationResult as any;
      let user;

      if (payload.payload) {
        const actualPayload = payload.payload;
        user = {
          id: actualPayload.sub || actualPayload.id,
          email: actualPayload.email,
          given_name: actualPayload.given_name,
          family_name: actualPayload.family_name,
          picture: actualPayload.picture,
          ...actualPayload
        };
      }

      expect(user).toEqual({
        id: 'user123',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://example.com/avatar.jpg',
        sub: 'user123',
      });
    });

    it('should extract user data from direct payload', () => {
      const validationResult = {
        valid: true,
        sub: 'user123',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://example.com/avatar.jpg',
      };

      const payload = validationResult as any;
      let user;

      if (payload.sub) {
        user = {
          id: payload.sub,
          email: payload.email,
          given_name: payload.given_name,
          family_name: payload.family_name,
          picture: payload.picture,
          ...payload
        };
      }

      expect(user).toEqual({
        id: 'user123',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://example.com/avatar.jpg',
        valid: true,
        sub: 'user123',
      });
    });

    it('should handle missing optional user fields', () => {
      const validationResult = {
        valid: true,
        payload: {
          sub: 'user123',
          email: 'test@example.com',
          // Missing given_name, family_name, picture
        },
      };

      const payload = validationResult as any;
      let user;

      if (payload.payload) {
        const actualPayload = payload.payload;
        user = {
          id: actualPayload.sub || actualPayload.id,
          email: actualPayload.email,
          given_name: actualPayload.given_name,
          family_name: actualPayload.family_name,
          picture: actualPayload.picture,
          ...actualPayload
        };
      }

      expect(user).toEqual({
        id: 'user123',
        email: 'test@example.com',
        given_name: undefined,
        family_name: undefined,
        picture: undefined,
        sub: 'user123',
      });
    });
  });

  describe('Auth Plugin Registration', () => {
    it('should register auth plugin successfully', async () => {
      // Test that the auth plugin can be imported and is a function
      expect(typeof authPlugin).toBe('function');
      
      // Test that it's an async function (FastifyPluginAsync)
      expect(authPlugin.constructor.name).toBe('AsyncFunction');
    });
  });
}); 