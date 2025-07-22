import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FastifyPluginAsync } from 'fastify';

import { validateRequest, signedUrlBodySchema, challengeMediaBodySchema } from '../plugins/validation.js';
import { log } from '../utils/logger.js';

/**
 * File upload routes
 */
const uploadRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize S3 client
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

  // POST /upload/signed-url – Get signed URL for file upload
  fastify.post('/upload/signed-url', async (request, reply) => {
    try {
      const body = validateRequest(signedUrlBodySchema, request.body, 'Get signed URL body');

      // Validate file extension
      const fileExtension = body.fileName.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'wav' && fileExtension !== 'mp3') {
        reply.code(400).send({ error: 'Only .wav and .mp3 files are allowed' });
        return;
      }

      const params = {
        Bucket: process.env.AWS_S3_BUCKET || 'sf-pod-lam',
        Key: body.fileName,
        ContentType: body.fileType,
      };

      const command = new PutObjectCommand(params);
      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600, // 1 hour
      });

      log.info(`Generated signed URL for file: ${body.fileName}`);
      reply.send({ signedUrl });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to generate signed URL', err, { body: request.body });
      reply.code(500).send({ error: 'Failed to generate signed URL' });
    }
  });

  // POST /upload/challenge-media – Get signed URL for challenge media upload
  fastify.post('/upload/challenge-media', async (request, reply) => {
    try {
      const body = validateRequest(challengeMediaBodySchema, request.body, 'Challenge media upload body');

      // Validate file extension for media files
      const fileExtension = body.fileName.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm'];

      if (!allowedExtensions.includes(fileExtension || '')) {
        reply.code(400).send({
          error: `Only ${allowedExtensions.join(', ')} files are allowed for challenge media`
        });
        return;
      }

      // Generate unique filename with challenge context
      const timestamp = Date.now();
      const uniqueFileName = `challenge-media/${body.challengeId || 'general'}/${timestamp}-${body.fileName}`;

      const params = {
        Bucket: process.env.AWS_S3_BUCKET || 'sf-pod-lam',
        Key: uniqueFileName,
        ContentType: body.fileType,
      };

      const command = new PutObjectCommand(params);
      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600, // 1 hour
      });

      log.info(`Generated challenge media signed URL for file: ${uniqueFileName}`);
      reply.send({
        signedUrl,
        fileName: uniqueFileName,
        mediaUrl: `https://${process.env.AWS_S3_BUCKET || 'sf-pod-lam'}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${uniqueFileName}`
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to generate challenge media signed URL', err, { body: request.body });
      reply.code(500).send({ error: 'Failed to generate challenge media signed URL' });
    }
  });
};

export default uploadRoutes;
