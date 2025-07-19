# SmartFyt API

Backend service for the SmartFyt student-athlete performance tracking platform.

## 🚀 Features

- **Fastify** - High-performance web framework
- **TypeScript** - Type-safe development
- **Prisma** - Database ORM with migrations
- **JWT Authentication** - Kinde integration
- **Structured Logging** - Pino logging with structured output
- **Health Monitoring** - Health check endpoints
- **Data Analytics** - Performance metrics and insights

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Kinde account for authentication

## 🛠 Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database setup:**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## 📖 API Endpoints

### Health Check
- `GET /health` - Server health status

### User Management
- `GET /users/:userId/data` - Get user profile data
- `GET /users/:userId/info` - Get detailed user information

### Health Data
- `GET /users/:userId/health` - Get health metrics and activity data

### Journals & Forms
- `GET /users/:userId/journals` - Get user journal entries
- `GET /users/:userId/forms` - Get user form submissions

### Teams & Sports
- `GET /teams` - Get all teams
- `GET /sports` - Get all sports
- `GET /schools` - Get all schools

### Quests & Metrics
- `GET /users/:userId/quests` - Get user quests
- `GET /users/:userId/metrics` - Get performance metrics

### Coach Features
- `GET /coach/:coachId/teams` - Get coach's teams
- `GET /coach/:coachId/athletes` - Get coach's athletes

## 🔧 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run test` - Run tests
- `npm run lint` - Lint code

## 🏗 Architecture

```
src/
├── server.ts           # Main server entry point
├── plugins/            # Fastify plugins
│   ├── auth.ts        # Authentication middleware
│   └── validation.ts  # Request validation
├── routes/            # API route handlers
│   ├── users.ts
│   ├── health.ts
│   ├── journals.ts
│   └── ...
└── utils/
    └── logger.ts      # Structured logging
```

## 🔐 Authentication

All endpoints (except `/health`) require a valid JWT token from Kinde.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

## 🐳 Docker Support (Coming Soon)

Docker configuration will be added for easy containerized deployment.

## 🚀 Deployment

The API can be deployed to:
- **Railway** - Recommended for simplicity
- **Fly.io** - Good performance and scaling
- **Vercel Functions** - Serverless option
- **AWS/GCP/Azure** - Traditional cloud providers

## 📊 Monitoring

- Health checks available at `/health`
- Structured logging with Pino
- Error tracking and performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details 