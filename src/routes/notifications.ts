import { FastifyPluginAsync } from 'fastify';
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const notificationsRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /notifications – create a notification
  fastify.post('/notifications', async (request, reply) => {
    const body = request.body as {
      userId: string;
      message: string;
      type?: string;
      link?: string;
      actorId?: string;
    };

    try {
      if (!body.userId || !body.message) {
        reply.code(400).send({ error: 'userId and message are required' });
        return;
      }

      console.log('[API] createNotification called with data:', body);

      const notification = await prisma.notification.create({
        data: {
          userId: body.userId,
          message: body.message,
          type: body.type,
          link: body.link,
          actorId: body.actorId,
          read: false,
        },
      });

      console.log('[API] Notification created:', notification.id);
      reply.code(201).send({ success: true, notification });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to create notification' });
    }
  });

  // GET /users/:userId/notifications – get user notifications
  fastify.get('/users/:userId/notifications', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const { limit = '20', onlyUnread = 'false' } = request.query as { 
      limit?: string; 
      onlyUnread?: string; 
    };

    try {
      console.log(`[API] getNotifications called for user: ${userId}`);

      const whereClause: any = { userId };
      if (onlyUnread === 'true') {
        whereClause.read = false;
      }

      const limitNumber = parseInt(limit, 10) || 20;

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limitNumber,
        include: {
          actor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
      });

      console.log(`[API] Found ${notifications.length} notifications for user ${userId}`);
      reply.send({ success: true, notifications });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch notifications' });
    }
  });

  // GET /users/:userId/notifications/count – get unread notification count
  fastify.get('/users/:userId/notifications/count', async (request, reply) => {
    const { userId } = request.params as { userId: string };

    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      });

      reply.send({ success: true, count });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch notification count' });
    }
  });

  // PUT /users/:userId/notifications/:notificationId/read – mark notification as read
  fastify.put('/users/:userId/notifications/:notificationId/read', async (request, reply) => {
    const { userId, notificationId } = request.params as { 
      userId: string; 
      notificationId: string; 
    };

    try {
      console.log(`[API] markNotificationRead called for id: ${notificationId} by user: ${userId}`);

      const updated = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId, // Ensure user can only mark their own notifications
        },
        data: { read: true },
      });

      if (updated.count === 0) {
        console.warn(`[API] Notification ${notificationId} not found or user ${userId} unauthorized.`);
        reply.code(404).send({ error: 'Notification not found or unauthorized' });
        return;
      }

      console.log(`[API] Marked notification ${notificationId} as read.`);
      reply.send({ success: true });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to mark notification as read' });
    }
  });

  // PUT /users/:userId/notifications/read-all – mark all notifications as read
  fastify.put('/users/:userId/notifications/read-all', async (request, reply) => {
    const { userId } = request.params as { userId: string };

    try {
      console.log(`[API] markAllNotificationsRead called for user: ${userId}`);

      const updated = await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: { read: true },
      });

      console.log(`[API] Marked ${updated.count} notifications as read for user ${userId}.`);
      reply.send({ success: true, count: updated.count });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to mark all notifications as read' });
    }
  });
};

export default notificationsRoutes; 