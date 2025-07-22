import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import uploadRoutes from '../../routes/upload.js';
import { setupTestApp, expectErrorResponse, expectSuccessResponse } from '../utils/test-utils.js';

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  PutObjectCommand: vi.fn().mockImplementation((params) => params),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://mock-signed-url.com'),
}));

describe('Upload Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    app = Fastify();
    await setupTestApp(app);
    await app.register(uploadRoutes);
    await app.ready();
  });

  describe('POST /upload/signed-url', () => {
    it('should generate signed URL for valid audio files', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/upload/signed-url',
        payload: {
          fileName: 'test-audio.wav',
          fileType: 'audio/wav',
        },
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toHaveProperty('signedUrl');
      expect(payload.signedUrl).toBe('https://mock-signed-url.com');
    });

    it('should accept mp3 files', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/upload/signed-url',
        payload: {
          fileName: 'test-audio.mp3',
          fileType: 'audio/mpeg',
        },
      });

      expectSuccessResponse(response);
    });

    it('should reject invalid file types', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/upload/signed-url',
        payload: {
          fileName: 'test.txt',
          fileType: 'text/plain',
        },
      });

      expectErrorResponse(response, 400, 'Only .wav and .mp3 files are allowed');
    });

    it('should require fileName and fileType', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/upload/signed-url',
        payload: {
          fileName: 'test.wav',
        },
      });

      expectErrorResponse(response, 400, 'fileName and fileType are required');
    });
  });

  describe('POST /upload/challenge-media', () => {
    it('should generate signed URL for valid image files', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/upload/challenge-media',
        payload: {
          fileName: 'challenge-image.jpg',
          fileType: 'image/jpeg',
          challengeId: 'challenge123',
        },
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toHaveProperty('signedUrl');
      expect(payload).toHaveProperty('fileName');
      expect(payload).toHaveProperty('mediaUrl');
      expect(payload.fileName).toContain('challenge-media/challenge123/');
    });

    it('should accept video files', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/upload/challenge-media',
        payload: {
          fileName: 'challenge-video.mp4',
          fileType: 'video/mp4',
          challengeId: 'challenge456',
        },
      });

      const payload = expectSuccessResponse(response);
      expect(payload.fileName).toContain('challenge-media/challenge456/');
    });

    it('should reject invalid file types', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/upload/challenge-media',
        payload: {
          fileName: 'challenge.txt',
          fileType: 'text/plain',
        },
      });

      expectErrorResponse(response, 400, 'Only jpg, jpeg, png, gif, mp4, mov, avi, webm files are allowed for challenge media');
    });

    it('should require fileName and fileType', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/upload/challenge-media',
        payload: {
          fileName: 'challenge.jpg',
        },
      });

      expectErrorResponse(response, 400, 'fileName and fileType are required');
    });

    it('should work without challengeId', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/upload/challenge-media',
        payload: {
          fileName: 'general-image.png',
          fileType: 'image/png',
        },
      });

      const payload = expectSuccessResponse(response);
      expect(payload.fileName).toContain('challenge-media/general/');
    });
  });
}); 