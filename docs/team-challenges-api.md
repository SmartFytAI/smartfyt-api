# Team Challenges Gamification API

This document outlines the API implementation for the team challenges gamification feature.

## Database Schema

### New Models Added

#### TeamQuest
- **Purpose**: Team-specific quests that can be assigned to team members
- **Key Fields**:
  - `title`, `description`, `category`, `difficulty`
  - `pointValue`, `duration` (daily/weekly/monthly)
  - `startDate`, `endDate`, `teamId`, `createdBy`
  - `isActive` (for soft deletion)

#### TeamQuestAssignment
- **Purpose**: Links team quests to users and tracks assignment status
- **Key Fields**:
  - `questId`, `userId`, `assignedAt`
  - `status` (assigned/accepted/declined/completed)

#### TeamQuestCompletion
- **Purpose**: Records when users complete team quests
- **Key Fields**:
  - `questId`, `userId`, `completedAt`
  - `notes`, `evidence` (URL to proof)

#### TeamChallenge
- **Purpose**: Team competitions and challenges
- **Key Fields**:
  - `title`, `description`, `type` (step_competition/workout/habit/skill/team_building)
  - `duration` (days), `teamId`, `createdBy`
  - `startDate`, `endDate`, `isActive`

#### TeamChallengeParticipant
- **Purpose**: Tracks user participation in team challenges
- **Key Fields**:
  - `challengeId`, `userId`, `status` (invited/accepted/declined/completed)
  - `joinedAt`, `completedAt`, `score`

#### TeamRecognition
- **Purpose**: Recognition between teammates (claps, fire, heart, etc.)
- **Key Fields**:
  - `fromUserId`, `toUserId`, `teamId`
  - `type` (clap/fire/heart/flex/zap/trophy)
  - `message`, `createdAt`

#### UserRecognitionLimit
- **Purpose**: Daily limits for recognition types to prevent spam
- **Key Fields**:
  - `userId`, `date`
  - Counters for each recognition type (clapsUsed, firesUsed, etc.)

#### RecognitionInteraction
- **Purpose**: Track user interactions with recognitions (clapping, hearting, etc.)
- **Key Fields**:
  - `recognitionId`, `userId`, `interactionType`
  - `createdAt` timestamp
  - Unique constraint prevents duplicate interactions

## API Endpoints

### Team Quests

#### GET /teams/:teamId/quests
- **Description**: Get all active team quests for a team
- **Response**: Array of quests with creator and assignment details
- **Authentication**: Required

#### POST /teams/:teamId/quests
- **Description**: Create a new team quest
- **Body**:
  ```json
  {
    "title": "string",
    "description": "string", 
    "category": "string",
    "difficulty": "easy" | "medium" | "hard",
    "pointValue": number,
    "duration": "daily" | "weekly" | "monthly",
    "startDate": "string (ISO date)",
    "endDate": "string (ISO date)",
    "userIds": ["string"]
  }
  ```
- **Response**: Created quest with creator details
- **Side Effects**: Creates notifications for all assigned users

#### POST /teams/:teamId/quests/:questId/complete
- **Description**: Mark a team quest as completed by a user
- **Body**:
  ```json
  {
    "userId": "string",
    "notes": "string (optional)",
    "evidence": "string (optional)"
  }
  ```
- **Response**: Completion record
- **Side Effects**: Updates user stats and assignment status

### Team Challenges

#### GET /teams/:teamId/challenges
- **Description**: Get all active team challenges for a team
- **Response**: Array of challenges with creator and participant details
- **Authentication**: Required

#### POST /teams/:teamId/challenges
- **Description**: Create a new team challenge
- **Body**:
  ```json
  {
    "title": "string",
    "description": "string",
    "type": "step_competition" | "workout" | "habit" | "skill" | "team_building",
    "duration": number,
    "userIds": ["string"]
  }
  ```
- **Response**: Created challenge with creator details
- **Side Effects**: Creates notifications for all invited users

#### POST /teams/:teamId/challenges/:challengeId/join
- **Description**: Join a team challenge
- **Body**:
  ```json
  {
    "userId": "string"
  }
  ```
- **Response**: Updated participant record

### Team Recognitions

#### GET /teams/:teamId/recognitions
- **Description**: Get team recognitions (with pagination)
- **Query Params**: `limit` (default: 50)
- **Response**: Array of recognitions with user details
- **Authentication**: Required

#### POST /teams/:teamId/recognitions
- **Description**: Give recognition to a teammate
- **Body**:
  ```json
  {
    "fromUserId": "string",
    "toUserId": "string",
    "type": "clap" | "fire" | "heart" | "flex" | "zap" | "trophy",
    "message": "string (optional)"
  }
  ```
- **Response**: Created recognition with user details
- **Side Effects**: 
  - Updates daily usage limits
  - Creates notification for recipient
  - Enforces daily limits (clap: 10, fire: 5, heart: 8, flex: 3, zap: 5, trophy: 2)

### User Recognition Limits

#### GET /users/:userId/recognition-limits
- **Description**: Get user's daily recognition usage
- **Query Params**: `date` (optional, defaults to today)
- **Response**: Usage counts for each recognition type
- **Authentication**: Required

### Recognition Interactions

#### POST /teams/:teamId/recognitions/:recognitionId/interact
- **Description**: Interact with a recognition (clap, heart, fire, etc.)
- **Body**:
  ```json
  {
    "userId": "string",
    "interactionType": "clap" | "heart" | "fire" | "flex" | "zap" | "trophy"
  }
  ```
- **Response**: Interaction record or removal confirmation
- **Side Effects**: 
  - Creates notification for recognition recipient
  - Toggle behavior (add/remove interaction)
- **Authentication**: Required

#### GET /teams/:teamId/recognitions/:recognitionId/interactions
- **Description**: Get all interactions for a recognition
- **Response**: Grouped interactions by type with user details
- **Authentication**: Required

### Development/Mock Data

#### POST /mock/team-challenges/seed
- **Description**: Seed mock data for development
- **Response**: Success message with data structure info
- **Note**: For development only, not for production

## Integration with Existing Systems

### Notifications
The team challenges feature uses the existing `Notification` model for persistent notifications. This approach provides:

**Database-Stored Notifications:**
- **Team Quests**: `type: 'team_quest'` - New quest assignments
- **Team Challenges**: `type: 'team_challenge'` - New challenge invitations  
- **Team Recognitions**: `type: 'team_recognition'` - Recognition received from teammates
- **Quest Completions**: `type: 'quest_completed'` - Personal quest completion confirmations
- **Recognition Interactions**: `type: 'recognition_interaction'` - Reactions to recognitions

**Notification Strategy:**
- ✅ **Persistent**: Stored in database, survive sessions
- ✅ **Actionable**: Include links to relevant sections
- ✅ **Personalized**: Include actor information (who created/triggered)
- ✅ **Filterable**: Can be queried by type, read status, etc.
- ✅ **Integrated**: Works with existing notification system

**Smart Notifications:**
- Creators don't receive notifications for their own quests/challenges
- Recognition notifications go to recipients only
- Quest completion notifications include point values
- All notifications include deep links to relevant sections

### User Stats
- Quest completions update user stats in the `team-quests` category
- Points are awarded based on quest difficulty and completion

### Team System
- All features are scoped to teams
- Uses existing team membership system
- Integrates with existing team data

## Database Migration

### Migration File
- **Location**: `prisma/migrations/20250115000000_add_team_challenges_gamification/migration.sql`
- **Contains**: All table creation, indexes, and foreign key constraints

### Running Migration
```bash
# Review the migration first
cat prisma/migrations/20250115000000_add_team_challenges_gamification/migration.sql

# Apply the migration (after review)
npx prisma migrate deploy
```

## Seeding Data

### Seed Script
- **Location**: `scripts/seed-team-challenges.js`
- **Purpose**: Populate mock data for development and testing
- **Usage**: `node scripts/seed-team-challenges.js`

### Mock Data Includes
- 4 team quests (strength, endurance, health, team building)
- 3 team challenges (step competition, workout, habit)
- 4 recognitions (various types)
- 2 quest completions

## Frontend Integration

### Service Layer Updates Needed
The frontend `TeamChallengesService` should be updated to use these real API endpoints instead of mock data:

1. **Team Quests**:
   - `GET /teams/:teamId/quests` → `getTeamQuests(teamId)`
   - `POST /teams/:teamId/quests` → `createTeamQuest(teamId, data)`
   - `POST /teams/:teamId/quests/:questId/complete` → `completeTeamQuest(teamId, questId, data)`

2. **Team Challenges**:
   - `GET /teams/:teamId/challenges` → `getTeamChallenges(teamId)`
   - `POST /teams/:teamId/challenges` → `createTeamChallenge(teamId, data)`
   - `POST /teams/:teamId/challenges/:challengeId/join` → `joinTeamChallenge(teamId, challengeId, userId)`

3. **Team Recognitions**:
   - `GET /teams/:teamId/recognitions` → `getTeamRecognitions(teamId)`
   - `POST /teams/:teamId/recognitions` → `giveRecognition(teamId, data)`

4. **Recognition Limits**:
   - `GET /users/:userId/recognition-limits` → `getRecognitionLimits(userId)`

## Security Considerations

### Authentication
- All endpoints require authentication
- Uses existing auth plugin

### Authorization
- Users can only access data for teams they belong to
- Recognition limits prevent spam
- Quest/challenge creators are tracked

### Data Validation
- Input validation on all endpoints
- Type checking for enums (difficulty, duration, recognition types)
- Required field validation

## Performance Considerations

### Indexes
- Added indexes on frequently queried fields
- Composite indexes for unique constraints
- Foreign key indexes for joins

### Pagination
- Recognition endpoint supports pagination
- Default limit of 50 records

### Caching
- Consider Redis caching for frequently accessed data
- Team quests and challenges could be cached

## Testing

### API Testing
- All endpoints should be tested with real data
- Test recognition limits and edge cases
- Test notification creation

### Integration Testing
- Test with existing notification system
- Test with existing user stats system
- Test team membership integration

## Deployment Notes

### Prerequisites
1. Review and approve database migration
2. Ensure existing teams and users exist
3. Test with seed data

### Rollback Plan
- Migration can be rolled back if needed
- Data will be preserved in backup

### Monitoring
- Monitor notification creation rates
- Watch for recognition limit abuse
- Track quest/challenge completion rates 