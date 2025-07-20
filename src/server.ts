import Fastify from 'fastify';
import cors from '@fastify/cors';
import authPlugin from './plugins/auth.js';
import sportsRoutes from './routes/sports.js';
import schoolsRoutes from './routes/schools.js';
import teamsRoutes from './routes/teams.js';
import leadersRoutes from './routes/leaders.js';
import userInfoRoutes from './routes/userInfo.js';
import userMetricsRoutes from './routes/userMetrics.js';
import journalsRoutes from './routes/journals.js';
import questsRoutes from './routes/quests.js';
import statsRoutes from './routes/stats.js';
import healthRoutes from './routes/health.js';
import dashboardRoutes from './routes/dashboard.js';
import formsRoutes from './routes/forms.js';
import metricsRoutes from './routes/metricsLatest.js';
import terraRoutes from './routes/terra.js';
import teamPostsRoutes from './routes/teamPosts.js';
import questManagementRoutes from './routes/questManagement.js';
import userManagementRoutes from './routes/userManagement.js';
import chatSessionsRoutes from './routes/chatSessions.js';
import coachDataRoutes from './routes/coachData.js';
import notificationsRoutes from './routes/notifications.js';
import leaderboardRoutes from './routes/leaderboard.js';
import motivationalQuotesRoutes from './routes/motivationalQuotes.js';

// Load environment variables from the .env file
import { config } from 'dotenv';
import { resolve } from 'path';
import log from './utils/logger.js';

// Load environment variables from the project .env file
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

log.info('🔍 Environment Variables Check:');
log.info('KINDE_ISSUER_URL:', { configured: !!process.env.KINDE_ISSUER_URL });
log.info('KINDE_CLIENT_ID:', { configured: !!process.env.KINDE_CLIENT_ID });

const server = Fastify();

// Register CORS to allow frontend requests
server.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Public routes (no authentication required)
server.register(motivationalQuotesRoutes, { prefix: '/api/motivational-quotes' });

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

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

server
  .listen({ port, host: '0.0.0.0' })
  .then((address: string) => {
    console.log(`API server listening at ${address}`);
  })
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
