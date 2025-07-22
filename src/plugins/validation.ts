import { z , ZodSchema } from 'zod';

// Base validation function
export const validate = <T>(schema: ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

// Common parameter schemas
export const userIdParamSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const coachIdParamSchema = z.object({
  coachId: z.string().min(1, 'Coach ID is required'),
});

export const teamIdParamSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
});

export const challengeIdParamSchema = z.object({
  challengeId: z.string().min(1, 'Challenge ID is required'),
});

export const notificationIdParamSchema = z.object({
  notificationId: z.string().min(1, 'Notification ID is required'),
});

export const questIdParamSchema = z.object({
  questId: z.string().min(1, 'Quest ID is required'),
});

export const postIdParamSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
});

export const playerIdParamSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
});

export const athleteIdParamSchema = z.object({
  athleteId: z.string().min(1, 'Athlete ID is required'),
});

export const dateParamSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

// Common query schemas
export const paginationQuerySchema = z.object({
  limit: z.string().optional().transform((val) => parseInt(val || '20', 10)),
  offset: z.string().optional().transform((val) => parseInt(val || '0', 10)),
});

export const notificationQuerySchema = z.object({
  limit: z.string().optional(),
  onlyUnread: z.string().optional(),
});

export const chatQuerySchema = z.object({
  limit: z.string().optional().transform((val) => parseInt(val || '3', 10)),
});

export const healthQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const metricsQuerySchema = z.object({
  days: z.string().optional(),
});

export const teamQuerySchema = z.object({
  userId: z.string().optional(),
});

export const challengeQuerySchema = z.object({
  userId: z.string().optional(),
});

// Common body schemas
export const notificationBodySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.string().optional(),
  link: z.string().url().optional(),
  actorId: z.string().optional(),
});

export const chatSessionBodySchema = z.object({
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['text', 'image', 'file']).default('text'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const chatMessagesBodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.union([z.string(), z.record(z.string(), z.unknown())]),
  })).min(1, 'At least one message is required'),
});

export const createTeamChallengeBodySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['step_competition', 'workout', 'habit', 'skill', 'team_building']),
  duration: z.number().positive('Duration must be positive'),
  userIds: z.array(z.string().min(1, 'User ID is required')).min(1, 'At least one user ID is required'),
});

export const joinChallengeBodySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const teamRecognitionBodySchema = z.object({
  fromUserId: z.string().min(1, 'From user ID is required'),
  toUserId: z.string().min(1, 'To user ID is required'),
  type: z.enum(['clap', 'fire', 'heart', 'flex', 'zap', 'trophy']),
  message: z.string().optional(),
});

export const createUserBodySchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  profileImage: z.string().optional(),
  username: z.string().optional(),
});

export const updateGoalsBodySchema = z.object({
  goalType: z.enum(['athletic', 'academic']),
  value: z.string().min(1, 'Goal value is required'),
});

export const updateProfileImageBodySchema = z.object({
  imageUrl: z.string().min(1, 'Image URL is required'),
});

export const updateFormDataBodySchema = z.object({
  grade: z.string().optional(),
  school: z.string().optional(),
  sport: z.string().optional(),
  age: z.string().optional(),
  phone: z.string().optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  studyHours: z.number().min(0).max(24).optional(),
  activeHours: z.number().min(0).max(24).optional(),
  stressLevel: z.number().min(1).max(10).optional(),
  screenTime: z.number().min(0).max(24).optional(),
  wearable: z.string().optional(),
  coachName: z.string().optional(),
  coachEmail: z.string().email('Invalid email format').optional(),
});

export const coachFeedbackBodySchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
});

export const teamMembershipBodySchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  role: z.enum(['member', 'coach', 'admin']).default('member'),
});

export const teamPostBodySchema = z.object({
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['announcement', 'update', 'motivation']).default('update'),
  attachments: z.array(z.string()).optional(),
});

export const teamChallengeBodySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  goal: z.number().positive(),
  type: z.enum(['steps', 'workouts', 'nutrition', 'sleep']),
  reward: z.string().optional(),
});

export const challengeProgressBodySchema = z.object({
  progress: z.number().min(0),
  notes: z.string().optional(),
  completed: z.boolean().default(false),
});

export const questBodySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['fitness', 'nutrition', 'mental', 'social']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  points: z.number().positive(),
  deadline: z.string().datetime().optional(),
});

export const questNotesBodySchema = z.object({
  notes: z.string().min(1, 'Notes are required'),
});

export const userProfileBodySchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  school: z.string().min(1, 'School is required'),
  grade: z.string().min(1, 'Grade is required'),
  sport: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  athleticGoal: z.string().min(10, 'Athletic goal must be at least 10 characters'),
  academicGoal: z.string().min(10, 'Academic goal must be at least 10 characters'),
  bio: z.string().optional(),
});

export const terraConnectionBodySchema = z.object({
  isConnected: z.boolean(),
  provider: z.string().optional(),
});

export const contactBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  subject: z.string().optional(),
});

export const journalEntryBodySchema = z.object({
  content: z.string().min(1, 'Content is required'),
  mood: z.number().min(1).max(10),
  stress: z.number().min(1).max(10),
  sleepHours: z.number().min(0).max(24),
  activeHours: z.number().min(0).max(24),
  studyHours: z.number().min(0).max(24),
  screenTime: z.number().min(0).max(24),
  wentWell: z.string().optional(),
  notWell: z.string().optional(),
  goals: z.string().optional(),
});

export const uploadBodySchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.number().positive('File size must be positive'),
});

// Upload schemas
export const signedUrlBodySchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
});

export const challengeMediaBodySchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
  challengeId: z.string().optional(),
});

// Contact schemas
export const contactInquiryBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  organization: z.string().min(1, 'Organization is required'),
  planType: z.string().min(1, 'Plan type is required'),
  message: z.string().min(1, 'Message is required'),
});

// Journal schemas
export const journalPaginationQuerySchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
});

export const userIdWithDateParamSchema = userIdParamSchema.merge(dateParamSchema);

export const createJournalBodySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1, 'Title is required'),
  wentWell: z.string().optional(),
  notWell: z.string().optional(),
  goals: z.string().optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  activeHours: z.number().min(0).max(24).optional(),
  stress: z.number().min(0).max(10).optional(),
  screenTime: z.number().min(0).max(24).optional(),
  studyHours: z.number().min(0).max(24).optional(),
  createdAt: z.string().datetime().optional(),
});

// Team posts schemas
export const createTeamPostBodySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  authorId: z.string().min(1, 'Author ID is required'),
});

// Quest management schemas
export const completeQuestBodySchema = z.object({
  questId: z.string().min(1, 'Quest ID is required'),
  notes: z.string().max(280, 'Notes must be 280 characters or less').optional(),
});

// Health schemas
export const healthRangeQuerySchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

// Terra schemas
export const terraConnectionUpdateBodySchema = z.object({
  isConnected: z.boolean(),
  provider: z.string().optional(),
});

// Challenge progress schemas
export const challengeProgressUpdateBodySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  progress: z.number().min(0, 'Progress must be non-negative'),
  notes: z.string().optional(),
});

// Team membership schemas
export const teamMembershipCreateBodySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['member', 'coach', 'admin']).default('member'),
});

// Composite schemas for common route patterns
export const userIdWithPaginationSchema = userIdParamSchema.merge(paginationQuerySchema);
export const userIdWithNotificationQuerySchema = userIdParamSchema.merge(notificationQuerySchema);
export const userIdWithChatQuerySchema = userIdParamSchema.merge(chatQuerySchema);
export const userIdWithHealthQuerySchema = userIdParamSchema.merge(healthQuerySchema);
export const userIdWithMetricsQuerySchema = userIdParamSchema.merge(metricsQuerySchema);
export const userIdWithHealthRangeQuerySchema = userIdParamSchema.merge(healthRangeQuerySchema);

export const teamIdWithUserIdSchema = teamIdParamSchema.merge(z.object({
  userId: z.string().min(1, 'User ID is required'),
}));

export const challengeIdWithTeamIdSchema = challengeIdParamSchema.merge(teamIdParamSchema);
export const challengeIdWithTeamIdAndUserIdSchema = challengeIdWithTeamIdSchema.merge(z.object({
  userId: z.string().optional(),
}));

export const notificationIdWithUserIdSchema = notificationIdParamSchema.merge(userIdParamSchema);
export const questIdWithUserIdSchema = questIdParamSchema.merge(userIdParamSchema);
export const postIdWithTeamIdSchema = postIdParamSchema.merge(teamIdParamSchema);
export const playerIdWithCoachIdSchema = playerIdParamSchema.merge(coachIdParamSchema);

// Helper function to validate request data
export const validateRequest = <T>(
  schema: ZodSchema<T>,
  data: unknown,
  context: string
): T => {
  try {
    return validate(schema, data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = `${context} validation failed: ${error.errors.map(e => e.message).join(', ')}`;
      throw new Error(errorMessage);
    }
    throw error;
  }
};
