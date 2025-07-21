import { FastifyPluginAsync } from 'fastify';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
    const body = request.body as {
      fileName: string;
      fileType: string;
    };

    try {
      if (!body.fileName || !body.fileType) {
        reply.code(400).send({ error: 'fileName and fileType are required' });
        return;
      }

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

      reply.send({ signedUrl });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to generate signed URL' });
    }
  });
};

export default uploadRoutes; 