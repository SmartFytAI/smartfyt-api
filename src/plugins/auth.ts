import { FastifyPluginAsync } from 'fastify';
import { validateToken } from '@kinde/jwt-validator';
import log from '../utils/logger.js';

// Type for the validated token payload
interface KindeUser {
  id: string;
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  [key: string]: any;
}

// Extend Fastify request with user
declare module 'fastify' {
  interface FastifyRequest {
    user?: KindeUser;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Skip auth for health check and public endpoints
  const publicRoutes = ['/health'];
  
  fastify.addHook('onRequest', async (request, reply) => {
    // Skip authentication for public routes
    if (publicRoutes.includes(request.url)) {
      return;
    }

    try {
      const authHeader = request.headers['authorization'];
      
      if (!authHeader) {
        log.auth.failure('Missing authorization header', { 
          url: request.url, 
          method: request.method 
        });
        reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'Authorization header is required' 
        });
        return;
      }

      // Extract token from "Bearer <token>" format
      const token = authHeader.replace(/^Bearer\s+/i, '');
      
      if (!token) {
        log.auth.failure('Missing bearer token', { 
          url: request.url, 
          method: request.method 
        });
        reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'Bearer token is required' 
        });
        return;
      }

      // Get Kinde domain from environment variables
      const kindeDomain = process.env.KINDE_ISSUER_URL || process.env.KINDE_DOMAIN;
      
      if (!kindeDomain) {
        log.error('KINDE_ISSUER_URL or KINDE_DOMAIN environment variable is not set');
        reply.code(500).send({ 
          error: 'Internal Server Error', 
          message: 'Authentication configuration error' 
        });
        return;
      }

      // Validate the JWT token with Kinde
      const validationResult = await validateToken({
        token: token,
        domain: kindeDomain,
      });

      if (!validationResult.valid) {
        log.auth.tokenValidation(false, { 
          url: request.url, 
          method: request.method,
          result: validationResult
        });
        reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'Invalid or expired token'
        });
        return;
      }

      // Extract user information from the validated token
      // The validateToken function returns the decoded payload when valid
      const payload = validationResult as any; // Type assertion since the interface may not be complete
      
      if (payload.payload) {
        // Some JWT validators return { valid: true, payload: {...} }
        const actualPayload = payload.payload;
        request.user = {
          id: actualPayload.sub || actualPayload.id,
          email: actualPayload.email,
          given_name: actualPayload.given_name,
          family_name: actualPayload.family_name,
          picture: actualPayload.picture,
          ...actualPayload
        };
      } else if (payload.sub) {
        // Direct payload access
        request.user = {
          id: payload.sub,
          email: payload.email,
          given_name: payload.given_name,
          family_name: payload.family_name,
          picture: payload.picture,
          ...payload
        };
      } else {
        log.auth.failure('No user payload found in validated token', { 
          url: request.url, 
          method: request.method 
        });
        reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'Invalid token payload' 
        });
        return;
      }

      log.auth.success(request.user!.id, { 
        email: request.user!.email,
        url: request.url,
        method: request.method
      });
      
    } catch (error) {
      log.error('Authentication error occurred', error, { 
        url: request.url, 
        method: request.method 
      });
      reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Token validation failed' 
      });
      return;
    }
  });
};

export default authPlugin;
