import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '../../plugins/validation.js';

describe('Validation Plugin', () => {
  describe('validate function', () => {
    it('should validate simple string schema successfully', () => {
      const schema = z.string();
      const result = validate(schema, 'test string');
      
      expect(result).toBe('test string');
    });

    it('should validate number schema successfully', () => {
      const schema = z.number();
      const result = validate(schema, 42);
      
      expect(result).toBe(42);
    });

    it('should validate boolean schema successfully', () => {
      const schema = z.boolean();
      const result = validate(schema, true);
      
      expect(result).toBe(true);
    });

    it('should validate object schema successfully', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.string().email(),
      });

      const data = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };

      const result = validate(schema, data);
      
      expect(result).toEqual(data);
    });

    it('should validate array schema successfully', () => {
      const schema = z.array(z.string());
      const data = ['apple', 'banana', 'cherry'];
      
      const result = validate(schema, data);
      
      expect(result).toEqual(data);
    });

    it('should validate nested object schema successfully', () => {
      const schema = z.object({
        user: z.object({
          id: z.string(),
          profile: z.object({
            firstName: z.string(),
            lastName: z.string(),
          }),
        }),
        settings: z.object({
          theme: z.enum(['light', 'dark']),
          notifications: z.boolean(),
        }),
      });

      const data = {
        user: {
          id: 'user123',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        settings: {
          theme: 'dark',
          notifications: true,
        },
      };

      const result = validate(schema, data);
      
      expect(result).toEqual(data);
    });

    it('should validate optional fields successfully', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
        nullable: z.string().nullable(),
      });

      const data = {
        required: 'always present',
        // optional is missing
        nullable: null,
      };

      const result = validate(schema, data);
      
      expect(result).toEqual(data);
      expect(result.optional).toBeUndefined();
    });

    it('should validate with default values', () => {
      const schema = z.object({
        name: z.string(),
        count: z.number().default(0),
        active: z.boolean().default(true),
      });

      const data = {
        name: 'Test',
        // count and active are missing, should use defaults
      };

      const result = validate(schema, data);
      
      expect(result.name).toBe('Test');
      expect(result.count).toBe(0);
      expect(result.active).toBe(true);
    });

    it('should validate union types successfully', () => {
      const schema = z.union([
        z.object({ type: z.literal('user'), id: z.string() }),
        z.object({ type: z.literal('admin'), permissions: z.array(z.string()) }),
      ]);

      const userData = { type: 'user', id: 'user123' };
      const adminData = { type: 'admin', permissions: ['read', 'write'] };

      const userResult = validate(schema, userData);
      const adminResult = validate(schema, adminData);

      expect(userResult).toEqual(userData);
      expect(adminResult).toEqual(adminData);
    });

    it('should validate with transformations', () => {
      const schema = z.object({
        email: z.string().email().toLowerCase(),
        age: z.string().transform((val) => parseInt(val, 10)),
        tags: z.string().transform((val) => val.split(',').map(tag => tag.trim())),
      });

      const data = {
        email: 'TEST@EXAMPLE.COM',
        age: '25',
        tags: 'javascript, typescript, node',
      };

      const result = validate(schema, data);
      
      expect(result.email).toBe('test@example.com');
      expect(result.age).toBe(25);
      expect(result.tags).toEqual(['javascript', 'typescript', 'node']);
    });

    it('should validate with custom refinements', () => {
      const schema = z.object({
        password: z.string().refine(
          (val) => val.length >= 8,
          { message: 'Password must be at least 8 characters' }
        ),
        confirmPassword: z.string(),
      }).refine(
        (data) => data.password === data.confirmPassword,
        { message: 'Passwords do not match', path: ['confirmPassword'] }
      );

      const validData = {
        password: 'securepass123',
        confirmPassword: 'securepass123',
      };

      const result = validate(schema, validData);
      
      expect(result).toEqual(validData);
    });

    it('should throw error for invalid string data', () => {
      const schema = z.string();
      
      expect(() => validate(schema, 123)).toThrow();
      expect(() => validate(schema, null)).toThrow();
      expect(() => validate(schema, undefined)).toThrow();
    });

    it('should throw error for invalid number data', () => {
      const schema = z.number();
      
      expect(() => validate(schema, 'not a number')).toThrow();
      expect(() => validate(schema, null)).toThrow();
      expect(() => validate(schema, undefined)).toThrow();
    });

    it('should throw error for invalid object data', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.string().email(),
      });

      const invalidData = {
        name: 'John',
        age: 'not a number', // Should be number
        email: 'invalid-email', // Should be valid email
      };

      expect(() => validate(schema, invalidData)).toThrow();
    });

    it('should throw error for missing required fields', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.string().email(),
      });

      const incompleteData = {
        name: 'John',
        // Missing age and email
      };

      expect(() => validate(schema, incompleteData)).toThrow();
    });

    it('should throw error for invalid email format', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      const invalidEmails = [
        'not-an-email',
        'missing@',
        '@missing-domain.com',
        'spaces @example.com',
      ];

      invalidEmails.forEach(email => {
        expect(() => validate(schema, { email })).toThrow();
      });
    });

    it('should throw error for invalid enum values', () => {
      const schema = z.object({
        status: z.enum(['active', 'inactive', 'pending']),
      });

      expect(() => validate(schema, { status: 'invalid' })).toThrow();
      expect(() => validate(schema, { status: 'ACTIVE' })).toThrow(); // Case sensitive
    });

    it('should throw error for invalid array data', () => {
      const schema = z.array(z.string());
      
      expect(() => validate(schema, 'not an array')).toThrow();
      expect(() => validate(schema, [1, 2, 3])).toThrow(); // Numbers instead of strings
    });

    it('should throw error for custom refinement failures', () => {
      const schema = z.object({
        password: z.string().refine(
          (val) => val.length >= 8,
          { message: 'Password must be at least 8 characters' }
        ),
        confirmPassword: z.string(),
      }).refine(
        (data) => data.password === data.confirmPassword,
        { message: 'Passwords do not match' }
      );

      const invalidData = {
        password: 'short', // Too short
        confirmPassword: 'different', // Doesn't match
      };

      expect(() => validate(schema, invalidData)).toThrow();
    });

    it('should handle complex validation scenarios', () => {
      const userSchema = z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        profile: z.object({
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          age: z.number().min(0).max(150),
        }).optional(),
        roles: z.array(z.enum(['user', 'admin', 'moderator'])).min(1),
        metadata: z.record(z.string(), z.unknown()).optional(),
      });

      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          age: 30,
        },
        roles: ['user'],
        metadata: {
          lastLogin: '2024-01-01T00:00:00Z',
          preferences: { theme: 'dark' },
        },
      };

      const result = validate(userSchema, validUser);
      
      expect(result).toEqual(validUser);
    });
  });
}); 