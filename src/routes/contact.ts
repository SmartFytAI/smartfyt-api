import { FastifyPluginAsync } from 'fastify';
// ESM↔CJS interop
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

/**
 * Contact form routes
 */
const contactRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /contact – Submit contact inquiry
  fastify.post('/contact', async (request, reply) => {
    const body = request.body as {
      name: string;
      email: string;
      organization?: string;
      planType?: string;
      message: string;
    };

    try {
      if (!body.name || !body.email || !body.organization || !body.planType || !body.message) {
        reply.code(400).send({ error: 'Missing required fields: name, email, organization, planType, message' });
        return;
      }

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

      reply.code(201).send({ 
        success: true, 
        message: 'Inquiry submitted successfully',
        inquiry 
      });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to submit inquiry' });
    }
  });

  // GET /contact – Get all contact inquiries (admin only)
  fastify.get('/contact', async (request, reply) => {
    try {
      const inquiries = await prisma.contactInquiry.findMany({
        orderBy: { createdAt: 'desc' }
      });

      reply.send(inquiries);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch inquiries' });
    }
  });
};

export default contactRoutes; 