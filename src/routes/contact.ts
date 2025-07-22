import { FastifyPluginAsync } from 'fastify';

import prismaModule from '../../lib/prisma.js';
import { validateRequest, contactInquiryBodySchema } from '../plugins/validation.js';
import { log } from '../utils/logger.js';
// ESM↔CJS interop
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

/**
 * Contact form routes
 */
const contactRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /contact – Submit contact inquiry
  fastify.post('/contact', async (request, reply) => {
    try {
      const body = validateRequest(contactInquiryBodySchema, request.body, 'Contact inquiry body');

      // Create contact inquiry
      const inquiry = await prisma.contactInquiry.create({
        data: {
          name: body.name,
          email: body.email,
          organization: body.organization,
          planType: body.planType,
          message: body.message,
        },
      });

      log.info(`Contact inquiry submitted: ${body.email}`);
      reply.code(201).send({
        success: true,
        message: 'Inquiry submitted successfully',
        inquiry
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to submit inquiry', err, { body: request.body });
      reply.code(500).send({ error: 'Failed to submit inquiry' });
    }
  });

  // GET /contact – Get all contact inquiries (admin only)
  fastify.get('/contact', async (request, reply) => {
    try {
      const inquiries = await prisma.contactInquiry.findMany({
        orderBy: { createdAt: 'desc' }
      });

      log.info(`Fetched ${inquiries.length} contact inquiries`);
      reply.send(inquiries);
    } catch (err) {
      log.error('Failed to fetch inquiries', err);
      reply.code(500).send({ error: 'Failed to fetch inquiries' });
    }
  });
};

export default contactRoutes;
