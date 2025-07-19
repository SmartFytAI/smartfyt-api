import { FastifyPluginAsync } from 'fastify';
import prismaModule from '../../lib/prisma.js';
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
    const { teamId } = request.params as { teamId: string };
    try {
      const posts = await prisma.teamPost.findMany({
        where: { teamID: teamId },
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

      reply.send(formattedPosts);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch team posts' });
    }
  });

  // POST /teams/:teamId/posts – create team post
  fastify.post('/teams/:teamId/posts', async (request, reply) => {
    const { teamId } = request.params as { teamId: string };
    const body = request.body as {
      title: string;
      content: string;
      authorId: string;
    };

    try {
      if (!body.title || !body.content || !body.authorId) {
        reply.code(400).send({ error: 'Missing required fields: title, content, authorId' });
        return;
      }

      // Check if the user is a member for this team
      const teamMember = await prisma.teamMembership.findFirst({
        where: {
          userId: body.authorId,
          teamId,
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
          teamID: teamId,
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

      reply.code(201).send({
        ...newPost,
        formattedContent: formatContent(newPost.content),
      });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to create team post' });
    }
  });

  // PUT /teams/:teamId/posts/:postId – update team post
  fastify.put('/teams/:teamId/posts/:postId', async (request, reply) => {
    const { teamId, postId } = request.params as { teamId: string; postId: string };
    const body = request.body as {
      title: string;
      content: string;
      userId: string;
    };

    try {
      if (!body.title || !body.content || !body.userId) {
        reply.code(400).send({ error: 'Missing required fields: title, content, userId' });
        return;
      }

      // Check if the user is the author or a coach
      const [post, isCoach] = await Promise.all([
        prisma.teamPost.findUnique({
          where: { id: postId },
          select: { authorID: true, teamID: true },
        }),
        prisma.teamMembership.findFirst({
          where: {
            userId: body.userId,
            teamId,
            role: 'coach',
          },
        }),
      ]);

      if (!post) {
        reply.code(404).send({ error: 'Post not found' });
        return;
      }

      if (post.authorID !== body.userId && !isCoach) {
        reply.code(403).send({ error: 'You can only edit your own posts or you must be a coach' });
        return;
      }

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

      reply.send({
        ...updatedPost,
        formattedContent: formatContent(updatedPost.content),
      });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to update team post' });
    }
  });

  // DELETE /teams/:teamId/posts/:postId – delete team post
  fastify.delete('/teams/:teamId/posts/:postId', async (request, reply) => {
    const { teamId, postId } = request.params as { teamId: string; postId: string };
    const { userId } = request.query as { userId: string };

    try {
      if (!userId) {
        reply.code(400).send({ error: 'userId query parameter is required' });
        return;
      }

      // Check if the user is a coach for this team
      const isCoach = await prisma.teamMembership.findFirst({
        where: {
          userId,
          teamId,
          role: 'coach',
        },
      });

      // If the user is not a coach, check if they are the author of the post
      if (!isCoach) {
        const post = await prisma.teamPost.findUnique({
          where: { id: postId },
          select: { authorID: true },
        });

        if (!post) {
          reply.code(404).send({ error: 'Post not found' });
          return;
        }

        if (post.authorID !== userId) {
          reply.code(403).send({ error: "You don't have permission to delete this post" });
          return;
        }
      }

      // Delete the post
      await prisma.teamPost.delete({
        where: { id: postId },
      });

      reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to delete team post' });
    }
  });
};

export default teamPostsRoutes; 