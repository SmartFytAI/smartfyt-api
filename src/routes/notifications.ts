import { FastifyPluginAsync } from 'fastify';

import prismaModule from '../../lib/prisma.js';
import {
  validateRequest,
  notificationBodySchema,
  userIdParamSchema,
  notificationQuerySchema,
  notificationIdWithUserIdSchema
} from '../plugins/validation.js';
import log from '../utils/logger.js';

const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const notificationsRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /notifications – create a notification
  fastify.post('/notifications', async (request, reply) => {
    try {
      const body = validateRequest(notificationBodySchema, request.body, 'Create notification');

      log.info('[API] createNotification called with data:', { body });

      const notification = await prisma.notification.create({
        data: {
          userId: body.userId,
          message: body.message,
          type: body.type || 'general',
          link: body.link,
          actorId: body.actorId,
          read: false,
        },
      });

      log.info('[API] Notification created:', { notificationId: notification.id });
      reply.code(201).send({ success: true, notification });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        log.warn('[API] Validation error in createNotification:', { error: err.message });
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to create notification', err, { body: request.body });
      reply.code(500).send({ error: 'Failed to create notification' });
    }
  });

  // GET /users/:userId/notifications – get user notifications
  fastify.get('/users/:userId/notifications', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Get notifications params');
      const query = validateRequest(notificationQuerySchema, request.query, 'Get notifications query');

      log.info(`[API] getNotifications called for user: ${params.userId}`);

      const whereClause: any = { userId: params.userId };
      const onlyUnread = query.onlyUnread === 'true';
      const limit = parseInt(query.limit || '20', 10);

      if (onlyUnread) {
        whereClause.read = false;
      }

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
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

      log.info(`[API] Found ${notifications.length} notifications for user ${params.userId}`);
      reply.send({ success: true, notifications });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        log.warn('[API] Validation error in getNotifications:', { error: err.message });
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to fetch notifications', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to fetch notifications' });
    }
  });

  // GET /users/:userId/notifications/count – get unread notification count
  fastify.get('/users/:userId/notifications/count', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Get notification count params');

      const count = await prisma.notification.count({
        where: {
          userId: params.userId,
          read: false,
        },
      });

      reply.send({ success: true, count });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        log.warn('[API] Validation error in getNotificationCount:', { error: err.message });
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to fetch notification count', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to fetch notification count' });
    }
  });

  // PUT /users/:userId/notifications/:notificationId/read – mark notification as read
  fastify.put('/users/:userId/notifications/:notificationId/read', async (request, reply) => {
    try {
      const params = validateRequest(notificationIdWithUserIdSchema, request.params, 'Mark notification read params');

      const notification = await prisma.notification.update({
        where: {
          id: params.notificationId,
          userId: params.userId,
        },
        data: {
          read: true,
        },
      });

      reply.send({ success: true, notification });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        log.warn('[API] Validation error in markNotificationRead:', { error: err.message });
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to mark notification as read', err, { params: request.params });
      reply.code(500).send({ error: 'Failed to mark notification as read' });
    }
  });

  // PUT /users/:userId/notifications/read-all – mark all notifications as read
  fastify.put('/users/:userId/notifications/read-all', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Mark all notifications read params');

      const result = await prisma.notification.updateMany({
        where: {
          userId: params.userId,
          read: false,
        },
        data: {
          read: true,
        },
      });

      reply.send({ success: true, count: result.count });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        log.warn('[API] Validation error in markAllNotificationsRead:', { error: err.message });
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to mark all notifications as read', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to mark all notifications as read' });
    }
  });

  // DELETE /users/:userId/notifications – delete all user notifications
  fastify.delete('/users/:userId/notifications', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Delete notifications params');

      await prisma.notification.deleteMany({
        where: {
          userId: params.userId,
        },
      });

      reply.send({ success: true, message: 'All notifications deleted' });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        log.warn('[API] Validation error in deleteNotifications:', { error: err.message });
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to delete notifications', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to delete notifications' });
    }
  });
};

export default notificationsRoutes;
