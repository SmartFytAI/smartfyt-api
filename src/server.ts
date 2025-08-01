import { resolve } from 'path';

import cors from '@fastify/cors';
import { config } from 'dotenv';
import Fastify from 'fastify';

import authPlugin from './plugins/auth.js';
import challengeProgressRoutes from './routes/challengeProgress.js';
import chatSessionsRoutes from './routes/chatSessions.js';
import coachDataRoutes from './routes/coachData.js';
import contactRoutes from './routes/contact.js';
import dashboardRoutes from './routes/dashboard.js';
import debugRoutes from './routes/debug.js';
import formsRoutes from './routes/forms.js';
import healthRoutes from './routes/health.js';
import journalsRoutes from './routes/journals.js';
import leaderboardRoutes from './routes/leaderboard.js';
import leadersRoutes from './routes/leaders.js';
import metricsRoutes from './routes/metricsLatest.js';
import motivationalQuotesRoutes from './routes/motivationalQuotes.js';
import notificationsRoutes from './routes/notifications.js';
import pushNotificationRoutes from './routes/pushNotifications.js';
import questManagementRoutes from './routes/questManagement.js';
import questsRoutes from './routes/quests.js';
import schoolsRoutes from './routes/schools.js';
import sportsRoutes from './routes/sports.js';
import statsRoutes from './routes/stats.js';
import teamChallengesRoutes from './routes/teamChallenges.js';
import teamPostsRoutes from './routes/teamPosts.js';
import teamsRoutes from './routes/teams.js';
import terraRoutes from './routes/terra.js';
import uploadRoutes from './routes/upload.js';
import userInfoRoutes from './routes/userInfo.js';
import userManagementRoutes from './routes/userManagement.js';
import userMetricsRoutes from './routes/userMetrics.js';
import log from './utils/logger.js';

// Load environment variables from the project .env file
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

log.info('🔍 Environment Variables Check:');
log.info('KINDE_ISSUER_URL:', { configured: !!process.env.KINDE_ISSUER_URL });
log.info('KINDE_CLIENT_ID:', { configured: !!process.env.KINDE_CLIENT_ID });

const server = Fastify();

// Register CORS to allow frontend requests
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001'
];

// Add production URLs from environment variables
if (process.env.NEXT_PUBLIC_APP_URL) {
  allowedOrigins.push(process.env.NEXT_PUBLIC_APP_URL);
}

// Add any additional production URLs
if (process.env.ADDITIONAL_CORS_ORIGINS) {
  const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS.split(',').map(origin => origin.trim());
  allowedOrigins.push(...additionalOrigins);
}

server.register(cors, {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Public routes (no authentication required)
server.register(motivationalQuotesRoutes, { prefix: '/api/motivational-quotes' });
server.register(contactRoutes, { prefix: '/api/contact' });
server.register(uploadRoutes, { prefix: '/api/upload' });
server.register(debugRoutes, { prefix: '/api/debug' });

// Apply authentication middleware to all routes
server.register(authPlugin);

// Public health check endpoint (handled in auth plugin)
server.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '1.0.0'
}));

// All routes below are now protected by authentication
server.register(sportsRoutes);
server.register(schoolsRoutes);
server.register(teamsRoutes);
server.register(leadersRoutes);
server.register(userInfoRoutes);
server.register(userMetricsRoutes);
server.register(journalsRoutes);
server.register(questsRoutes);
server.register(statsRoutes);
server.register(healthRoutes);
server.register(dashboardRoutes);
server.register(formsRoutes);
server.register(metricsRoutes);
server.register(terraRoutes);
server.register(teamPostsRoutes);
server.register(questManagementRoutes);
server.register(userManagementRoutes);
server.register(chatSessionsRoutes);
server.register(coachDataRoutes);
server.register(notificationsRoutes);
server.register(leaderboardRoutes);
server.register(teamChallengesRoutes);
server.register(pushNotificationRoutes);

server.register(challengeProgressRoutes);

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

server
  .listen({ port, host: '0.0.0.0' })
  .then((address: string) => {
    log.info(`API server listening at ${address}`);
  })
  .catch((err: unknown) => {
    log.error('Failed to start server', err);
    process.exit(1);
  });
