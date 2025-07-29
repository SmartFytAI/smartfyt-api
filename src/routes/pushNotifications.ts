import { FastifyPluginAsync } from 'fastify';
import webpush from 'web-push';

import prismaModule from '../../lib/prisma.js';
import {
  validateRequest,
  pushSubscriptionSchema,
  userIdParamSchema,
} from '../plugins/validation.js';
import log from '../utils/logger.js';

const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

// Configure VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  log.warn('VAPID keys not configured - push notifications will not work');
}

webpush.setVapidDetails(
  'mailto:notifications@smartfyt.com',
  VAPID_PUBLIC_KEY || '',
  VAPID_PRIVATE_KEY || ''
);

const pushNotificationRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /push/subscribe – subscribe to push notifications
  fastify.post('/push/subscribe', async (request, reply) => {
    try {
      const body = validateRequest(pushSubscriptionSchema, request.body, 'Push subscription');

      log.info('[API] Push subscription request', { userId: body.userId });

      // Store subscription in database
      await prisma.pushSubscription.upsert({
        where: {
          userId_endpoint: {
            userId: body.userId,
            endpoint: body.subscription.endpoint,
          },
        },
        update: {
          p256dh: body.subscription.keys.p256dh,
          auth: body.subscription.keys.auth,
          updatedAt: new Date(),
        },
        create: {
          userId: body.userId,
          endpoint: body.subscription.endpoint,
          p256dh: body.subscription.keys.p256dh,
          auth: body.subscription.keys.auth,
        },
      });

      log.info('[API] Push subscription stored successfully');
      reply.code(201).send({ success: true, message: 'Subscription created' });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        log.warn('[API] Validation error in push subscription:', { error: err.message });
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to subscribe to push notifications', err);
      reply.code(500).send({ error: 'Failed to subscribe to push notifications' });
    }
  });

  // POST /push/unsubscribe – unsubscribe from push notifications
  fastify.post('/push/unsubscribe', async (request, reply) => {
    try {
      const body = validateRequest(pushSubscriptionSchema, request.body, 'Push unsubscription');

      log.info('[API] Push unsubscription request', { userId: body.userId });

      // Remove subscription from database
      await prisma.pushSubscription.deleteMany({
        where: {
          userId: body.userId,
          endpoint: body.subscription.endpoint,
        },
      });

      log.info('[API] Push subscription removed successfully');
      reply.send({ success: true, message: 'Subscription removed' });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        log.warn('[API] Validation error in push unsubscription:', { error: err.message });
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to unsubscribe from push notifications', err);
      reply.code(500).send({ error: 'Failed to unsubscribe from push notifications' });
    }
  });

  // POST /push/send – send push notification to user
  fastify.post('/push/send', async (request, reply) => {
    try {
      const body = validateRequest(
        {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            title: { type: 'string' },
            body: { type: 'string' },
            icon: { type: 'string' },
            badge: { type: 'string' },
            tag: { type: 'string' },
            data: { type: 'object' },
          },
          required: ['userId', 'title', 'body'],
        },
        request.body,
        'Send push notification'
      );

      log.info('[API] Send push notification request', { userId: body.userId });

      // Get user's push subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: body.userId },
      });

      if (subscriptions.length === 0) {
        log.warn('[API] No push subscriptions found for user', { userId: body.userId });
        reply.code(404).send({ error: 'No push subscriptions found for user' });
        return;
      }

      // Send push notification to all user's devices
      const results = await Promise.allSettled(
        subscriptions.map(async (subscription) => {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          };

          const payload = JSON.stringify({
            title: body.title,
            body: body.body,
            icon: body.icon,
            badge: body.badge,
            tag: body.tag,
            data: body.data,
          });

          return webpush.sendNotification(pushSubscription, payload);
        })
      );

      // Count successful and failed sends
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      log.info('[API] Push notification sent', {
        userId: body.userId,
        successful,
        failed,
        total: subscriptions.length,
      });

      reply.send({
        success: true,
        message: 'Push notification sent',
        results: { successful, failed, total: subscriptions.length },
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        log.warn('[API] Validation error in send push notification:', { error: err.message });
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to send push notification', err);
      reply.code(500).send({ error: 'Failed to send push notification' });
    }
  });

  // POST /push/send-to-team – send push notification to all team members
  fastify.post('/push/send-to-team', async (request, reply) => {
    try {
      const body = validateRequest(
        {
          type: 'object',
          properties: {
            teamId: { type: 'string' },
            title: { type: 'string' },
            body: { type: 'string' },
            icon: { type: 'string' },
            badge: { type: 'string' },
            tag: { type: 'string' },
            data: { type: 'object' },
            excludeUserId: { type: 'string' }, // Optional: exclude sender
          },
          required: ['teamId', 'title', 'body'],
        },
        request.body,
        'Send push notification to team'
      );

      log.info('[API] Send push notification to team request', { teamId: body.teamId });

      // Get all team members
      const teamMembers = await prisma.teamMember.findMany({
        where: {
          teamId: body.teamId,
          ...(body.excludeUserId && { userId: { not: body.excludeUserId } }),
        },
        include: {
          user: {
            include: {
              pushSubscriptions: true,
            },
          },
        },
      });

      if (teamMembers.length === 0) {
        log.warn('[API] No team members found', { teamId: body.teamId });
        reply.code(404).send({ error: 'No team members found' });
        return;
      }

      // Collect all push subscriptions
      const allSubscriptions = teamMembers.flatMap(member => 
        member.user.pushSubscriptions.map(subscription => ({
          subscription,
          userId: member.userId,
        }))
      );

      if (allSubscriptions.length === 0) {
        log.warn('[API] No push subscriptions found for team members', { teamId: body.teamId });
        reply.code(404).send({ error: 'No push subscriptions found for team members' });
        return;
      }

      // Send push notification to all team members
      const results = await Promise.allSettled(
        allSubscriptions.map(async ({ subscription, userId }) => {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          };

          const payload = JSON.stringify({
            title: body.title,
            body: body.body,
            icon: body.icon,
            badge: body.badge,
            tag: body.tag,
            data: body.data,
          });

          return webpush.sendNotification(pushSubscription, payload);
        })
      );

      // Count successful and failed sends
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      log.info('[API] Team push notification sent', {
        teamId: body.teamId,
        successful,
        failed,
        total: allSubscriptions.length,
      });

      reply.send({
        success: true,
        message: 'Team push notification sent',
        results: { successful, failed, total: allSubscriptions.length },
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        log.warn('[API] Validation error in send team push notification:', { error: err.message });
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to send team push notification', err);
      reply.code(500).send({ error: 'Failed to send team push notification' });
    }
  });
};

export default pushNotificationRoutes; 