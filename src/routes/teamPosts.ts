import { FastifyPluginAsync } from 'fastify';

import prismaModule from '../../lib/prisma.js';
import { validateRequest, teamIdParamSchema, createTeamPostBodySchema } from '../plugins/validation.js';
import log from '../utils/logger.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const teamPostsRoutes: FastifyPluginAsync = async (fastify) => {
  // Helper function to format content with links
  function formatContent(content: string): string {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${url}</a>`;
    });
  }

  // GET /teams/:teamId/posts – get team posts
  fastify.get('/teams/:teamId/posts', async (request, reply) => {
    try {
      const params = validateRequest(teamIdParamSchema, request.params, 'Get team posts params');

      const posts = await prisma.teamPost.findMany({
        where: { teamID: params.teamId },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formattedPosts = posts.map((post) => ({
        ...post,
        formattedContent: formatContent(post.content),
      }));

      log.info(`Fetched team posts for team: ${params.teamId}`, { postCount: formattedPosts.length });
      reply.send(formattedPosts);
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to fetch team posts', err, { teamId: request.params });
      reply.code(500).send({ error: 'Failed to fetch team posts' });
    }
  });

  // POST /teams/:teamId/posts – create team post
  fastify.post('/teams/:teamId/posts', async (request, reply) => {
    try {
      const params = validateRequest(teamIdParamSchema, request.params, 'Create team post params');
      const body = validateRequest(createTeamPostBodySchema, request.body, 'Create team post body');

      // Check if the user is a member for this team
      const teamMember = await prisma.teamMembership.findFirst({
        where: {
          userId: body.authorId,
          teamId: params.teamId,
        },
      });

      if (!teamMember) {
        reply.code(403).send({ error: 'Only team members can create posts' });
        return;
      }

      // Create the post
      const newPost = await prisma.teamPost.create({
        data: {
          title: body.title,
          content: body.content,
          teamID: params.teamId,
          authorID: body.authorId,
          published: true,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
      });

      // TODO: Send notifications to team members (exclude author)
      // This could be handled by a separate notification service or webhook

      log.info(`Created team post for team: ${params.teamId}`, {
        postId: newPost.id,
        authorId: body.authorId
      });

      reply.code(201).send({
        ...newPost,
        formattedContent: formatContent(newPost.content),
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to create team post', err, { teamId: request.params });
      reply.code(500).send({ error: 'Failed to create team post' });
    }
  });

  // PUT /teams/:teamId/posts/:postId – update team post
  fastify.put('/teams/:teamId/posts/:postId', async (request, reply) => {
    try {
      const params = validateRequest(teamIdParamSchema, request.params, 'Update team post params');
      const body = validateRequest(createTeamPostBodySchema, request.body, 'Update team post body');
      const { postId } = request.params as { postId: string };

      // Check if the user is the author of the post
      const existingPost = await prisma.teamPost.findFirst({
        where: {
          id: postId,
          teamID: params.teamId,
          authorID: body.authorId,
        },
      });

      if (!existingPost) {
        reply.code(404).send({ error: 'Post not found or you are not the author' });
        return;
      }

      // Update the post
      const updatedPost = await prisma.teamPost.update({
        where: { id: postId },
        data: {
          title: body.title,
          content: body.content,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
      });

      log.info(`Updated team post: ${postId}`, {
        teamId: params.teamId,
        authorId: body.authorId
      });

      reply.send({
        ...updatedPost,
        formattedContent: formatContent(updatedPost.content),
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to update team post', err, { teamId: request.params, postId: request.params });
      reply.code(500).send({ error: 'Failed to update team post' });
    }
  });

  // DELETE /teams/:teamId/posts/:postId – delete team post
  fastify.delete('/teams/:teamId/posts/:postId', async (request, reply) => {
    try {
      const params = validateRequest(teamIdParamSchema, request.params, 'Delete team post params');
      const { postId } = request.params as { postId: string };
      const { authorId } = request.body as { authorId: string };

      if (!authorId) {
        reply.code(400).send({ error: 'Author ID is required' });
        return;
      }

      // Check if the user is the author of the post
      const existingPost = await prisma.teamPost.findFirst({
        where: {
          id: postId,
          teamID: params.teamId,
          authorID: authorId,
        },
      });

      if (!existingPost) {
        reply.code(404).send({ error: 'Post not found or you are not the author' });
        return;
      }

      // Delete the post
      await prisma.teamPost.delete({
        where: { id: postId },
      });

      log.info(`Deleted team post: ${postId}`, {
        teamId: params.teamId,
        authorId
      });

      reply.send({ success: true, message: 'Post deleted successfully' });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to delete team post', err, { teamId: request.params, postId: request.params });
      reply.code(500).send({ error: 'Failed to delete team post' });
    }
  });
};

export default teamPostsRoutes;
