import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreDevData() {
  console.log('🔄 Restoring Development Data...\n');

  try {
    // 1. Create Sports (use upsert to handle existing data)
    console.log('1. Creating Sports...');
    const sports = await Promise.all([
      prisma.sport.upsert({
        where: { name: 'Baseball' },
        update: {},
        create: { name: 'Baseball' }
      }),
      prisma.sport.upsert({
        where: { name: 'Brazilian Jiu Jitsu' },
        update: {},
        create: { name: 'Brazilian Jiu Jitsu' }
      }),
      prisma.sport.upsert({
        where: { name: 'Basketball' },
        update: {},
        create: { name: 'Basketball' }
      }),
      prisma.sport.upsert({
        where: { name: 'Soccer' },
        update: {},
        create: { name: 'Soccer' }
      }),
      prisma.sport.upsert({
        where: { name: 'Swimming' },
        update: {},
        create: { name: 'Swimming' }
      }),
    ]);
    console.log(`   ✅ Created ${sports.length} sports\n`);

    // 2. Create Schools (use upsert to handle existing data)
    console.log('2. Creating Schools...');
    const schools = await Promise.all([
      prisma.school.upsert({
        where: { name: 'Harvard University' },
        update: {},
        create: { name: 'Harvard University' }
      }),
      prisma.school.upsert({
        where: { name: 'Kimura Academy' },
        update: {},
        create: { name: 'Kimura Academy' }
      }),
      prisma.school.upsert({
        where: { name: 'Stanford University' },
        update: {},
        create: { name: 'Stanford University' }
      }),
    ]);
    console.log(`   ✅ Created ${schools.length} schools\n`);

    // 3. Create Users (use upsert to handle existing data)
    console.log('3. Creating Users...');
    const users = await Promise.all([
      // Harvard Baseball Team Members (same team as Chris)
      prisma.user.upsert({
        where: { id: 'harvard-coach-1' },
        update: {},
        create: {
          id: 'harvard-coach-1',
          email: 'coach.harvard@example.com',
          firstName: 'Mike',
          lastName: 'Johnson',
          profileImage: 'https://example.com/coach1.jpg',
          username: 'coach_mike',
          activeRole: 'coach',
          roles: ['coach'],
          schoolId: schools[0].id,
        }
      }),
      prisma.user.upsert({
        where: { id: 'harvard-player-1' },
        update: {},
        create: {
          id: 'harvard-player-1',
          email: 'alex.smith@harvard.edu',
          firstName: 'Alex',
          lastName: 'Smith',
          profileImage: 'https://example.com/player1.jpg',
          username: 'alex_smith',
          activeRole: 'student',
          roles: ['student'],
          schoolId: schools[0].id,
        }
      }),
      prisma.user.upsert({
        where: { id: 'harvard-player-2' },
        update: {},
        create: {
          id: 'harvard-player-2',
          email: 'sarah.davis@harvard.edu',
          firstName: 'Sarah',
          lastName: 'Davis',
          profileImage: 'https://example.com/player2.jpg',
          username: 'sarah_davis',
          activeRole: 'student',
          roles: ['student'],
          schoolId: schools[0].id,
        }
      }),
      prisma.user.upsert({
        where: { id: 'harvard-player-3' },
        update: {},
        create: {
          id: 'harvard-player-3',
          email: 'jake.wilson@harvard.edu',
          firstName: 'Jake',
          lastName: 'Wilson',
          profileImage: 'https://example.com/player3.jpg',
          username: 'jake_wilson',
          activeRole: 'student',
          roles: ['student'],
          schoolId: schools[0].id,
        }
      }),

      // Kimura BJJ Team Members (same team as Chris)
      prisma.user.upsert({
        where: { id: 'kimura-coach-1' },
        update: {},
        create: {
          id: 'kimura-coach-1',
          email: 'coach.kimura@example.com',
          firstName: 'Carlos',
          lastName: 'Santos',
          profileImage: 'https://example.com/coach2.jpg',
          username: 'coach_carlos',
          activeRole: 'coach',
          roles: ['coach'],
          schoolId: schools[1].id,
        }
      }),
      prisma.user.upsert({
        where: { id: 'kimura-student-1' },
        update: {},
        create: {
          id: 'kimura-student-1',
          email: 'maria.garcia@kimura.com',
          firstName: 'Maria',
          lastName: 'Garcia',
          profileImage: 'https://example.com/student1.jpg',
          username: 'maria_garcia',
          activeRole: 'student',
          roles: ['student'],
          schoolId: schools[1].id,
        }
      }),
      prisma.user.upsert({
        where: { id: 'kimura-student-2' },
        update: {},
        create: {
          id: 'kimura-student-2',
          email: 'david.chen@kimura.com',
          firstName: 'David',
          lastName: 'Chen',
          profileImage: 'https://example.com/student2.jpg',
          username: 'david_chen',
          activeRole: 'student',
          roles: ['student'],
          schoolId: schools[1].id,
        }
      }),
      prisma.user.upsert({
        where: { id: 'kimura-student-3' },
        update: {},
        create: {
          id: 'kimura-student-3',
          email: 'emma.thompson@kimura.com',
          firstName: 'Emma',
          lastName: 'Thompson',
          profileImage: 'https://example.com/student3.jpg',
          username: 'emma_thompson',
          activeRole: 'student',
          roles: ['student'],
          schoolId: schools[1].id,
        }
      }),

      // Test User (for testing)
      prisma.user.upsert({
        where: { id: 'test-user-123' },
        update: {},
        create: {
          id: 'test-user-123',
          email: 'test@smartfyt.com',
          firstName: 'Test',
          lastName: 'User',
          profileImage: 'https://example.com/test.jpg',
          username: 'testuser',
          activeRole: 'student',
          roles: ['student'],
          schoolId: schools[0].id,
        }
      }),

      // Chris Dolan (Kinde user)
      prisma.user.upsert({
        where: { id: 'kp_5192900f05334128b61ab2cd15f6974f' },
        update: {},
        create: {
          id: 'kp_5192900f05334128b61ab2cd15f6974f',
          email: 'cdolan@gmail.com',
          firstName: 'Chris',
          lastName: 'Dolan',
          profileImage: 'https://example.com/chris.jpg',
          username: 'chris_dolan',
          activeRole: 'student',
          roles: ['student'],
          schoolId: schools[0].id,
        }
      }),
    ]);
    console.log(`   ✅ Created ${users.length} users\n`);

    // 4. Create Teams (use upsert to handle existing data)
    console.log('4. Creating Teams...');
    const teams = await Promise.all([
      prisma.team.upsert({
        where: { 
          name_schoolID: {
            name: 'Harvard Baseball',
            schoolID: schools[0].id
          }
        },
        update: {},
        create: {
          name: 'Harvard Baseball',
          sportID: sports[0].id,
          schoolID: schools[0].id,
        }
      }),
      prisma.team.upsert({
        where: { 
          name_schoolID: {
            name: 'Kimura Brazilian Jiu Jitsu',
            schoolID: schools[1].id
          }
        },
        update: {},
        create: {
          name: 'Kimura Brazilian Jiu Jitsu',
          sportID: sports[1].id,
          schoolID: schools[1].id,
        }
      }),
    ]);
    console.log(`   ✅ Created ${teams.length} teams\n`);

    // 5. Create Team Memberships (use upsert to handle existing data)
    console.log('5. Creating Team Memberships...');
    const memberships = await Promise.all([
      // Harvard Baseball memberships
      prisma.teamMembership.upsert({
        where: { userId_teamId: { userId: 'harvard-coach-1', teamId: teams[0].id } },
        update: {},
        create: {
          teamId: teams[0].id,
          userId: 'harvard-coach-1',
          sportId: sports[0].id,
          role: 'coach',
        }
      }),
      prisma.teamMembership.upsert({
        where: { userId_teamId: { userId: 'harvard-player-1', teamId: teams[0].id } },
        update: {},
        create: {
          teamId: teams[0].id,
          userId: 'harvard-player-1',
          sportId: sports[0].id,
          role: 'player',
        }
      }),
      prisma.teamMembership.upsert({
        where: { userId_teamId: { userId: 'harvard-player-2', teamId: teams[0].id } },
        update: {},
        create: {
          teamId: teams[0].id,
          userId: 'harvard-player-2',
          sportId: sports[0].id,
          role: 'player',
        }
      }),
      prisma.teamMembership.upsert({
        where: { userId_teamId: { userId: 'harvard-player-3', teamId: teams[0].id } },
        update: {},
        create: {
          teamId: teams[0].id,
          userId: 'harvard-player-3',
          sportId: sports[0].id,
          role: 'player',
        }
      }),
      prisma.teamMembership.upsert({
        where: { userId_teamId: { userId: 'test-user-123', teamId: teams[0].id } },
        update: {},
        create: {
          teamId: teams[0].id,
          userId: 'test-user-123',
          sportId: sports[0].id,
          role: 'player',
        }
      }),
      prisma.teamMembership.upsert({
        where: { userId_teamId: { userId: 'kp_5192900f05334128b61ab2cd15f6974f', teamId: teams[0].id } },
        update: {},
        create: {
          teamId: teams[0].id,
          userId: 'kp_5192900f05334128b61ab2cd15f6974f',
          sportId: sports[0].id,
          role: 'player',
        }
      }),

      // Kimura BJJ memberships
      prisma.teamMembership.upsert({
        where: { userId_teamId: { userId: 'kimura-coach-1', teamId: teams[1].id } },
        update: {},
        create: {
          teamId: teams[1].id,
          userId: 'kimura-coach-1',
          sportId: sports[1].id,
          role: 'coach',
        }
      }),
      prisma.teamMembership.upsert({
        where: { userId_teamId: { userId: 'kimura-student-1', teamId: teams[1].id } },
        update: {},
        create: {
          teamId: teams[1].id,
          userId: 'kimura-student-1',
          sportId: sports[1].id,
          role: 'student',
        }
      }),
      prisma.teamMembership.upsert({
        where: { userId_teamId: { userId: 'kimura-student-2', teamId: teams[1].id } },
        update: {},
        create: {
          teamId: teams[1].id,
          userId: 'kimura-student-2',
          sportId: sports[1].id,
          role: 'student',
        }
      }),
      prisma.teamMembership.upsert({
        where: { userId_teamId: { userId: 'kimura-student-3', teamId: teams[1].id } },
        update: {},
        create: {
          teamId: teams[1].id,
          userId: 'kimura-student-3',
          sportId: sports[1].id,
          role: 'student',
        }
      }),
      prisma.teamMembership.upsert({
        where: { userId_teamId: { userId: 'test-user-123', teamId: teams[1].id } },
        update: {},
        create: {
          teamId: teams[1].id,
          userId: 'test-user-123',
          sportId: sports[1].id,
          role: 'student',
        }
      }),
      prisma.teamMembership.upsert({
        where: { userId_teamId: { userId: 'kp_5192900f05334128b61ab2cd15f6974f', teamId: teams[1].id } },
        update: {},
        create: {
          teamId: teams[1].id,
          userId: 'kp_5192900f05334128b61ab2cd15f6974f',
          sportId: sports[1].id,
          role: 'student',
        }
      }),
    ]);
    console.log(`   ✅ Created ${memberships.length} team memberships\n`);

    // 6. Create Team Challenges
    console.log('6. Creating Team Challenges...');
    const challenges = await Promise.all([
      // Harvard Baseball Challenges
      prisma.teamChallenge.create({
        data: {
          title: 'Weekly Steps Challenge',
          description: 'Get the most steps this week!',
          type: 'step_competition',
          duration: 7,
          teamId: teams[0].id,
          createdBy: 'harvard-coach-1',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
      }),
      prisma.teamChallenge.create({
        data: {
          title: 'Strength Training',
          description: 'Complete 3 strength workouts this week',
          type: 'workout',
          duration: 7,
          teamId: teams[0].id,
          createdBy: 'harvard-coach-1',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
      }),

      // Kimura BJJ Challenges
      prisma.teamChallenge.create({
        data: {
          title: 'BJJ Technique Practice',
          description: 'Practice your favorite technique 5 times this week',
          type: 'skill',
          duration: 7,
          teamId: teams[1].id,
          createdBy: 'kimura-coach-1',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
      }),
      prisma.teamChallenge.create({
        data: {
          title: 'Flexibility Challenge',
          description: 'Daily stretching routine',
          type: 'habit',
          duration: 14,
          teamId: teams[1].id,
          createdBy: 'kimura-coach-1',
          startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        }
      }),
    ]);
    console.log(`   ✅ Created ${challenges.length} team challenges\n`);

    // 7. Create Challenge Participants
    console.log('7. Creating Challenge Participants...');
    const participants = await Promise.all([
      // Harvard Baseball Challenge 1 participants
      prisma.teamChallengeParticipant.create({
        data: {
          challengeId: challenges[0].id,
          userId: 'harvard-player-1',
          status: 'joined',
          joinedAt: new Date(),
        }
      }),
      prisma.teamChallengeParticipant.create({
        data: {
          challengeId: challenges[0].id,
          userId: 'harvard-player-2',
          status: 'invited',
        }
      }),
      prisma.teamChallengeParticipant.create({
        data: {
          challengeId: challenges[0].id,
          userId: 'test-user-123',
          status: 'joined',
          joinedAt: new Date(),
        }
      }),
      prisma.teamChallengeParticipant.create({
        data: {
          challengeId: challenges[0].id,
          userId: 'kp_5192900f05334128b61ab2cd15f6974f',
          status: 'joined',
          joinedAt: new Date(),
        }
      }),

      // Harvard Baseball Challenge 2 participants
      prisma.teamChallengeParticipant.create({
        data: {
          challengeId: challenges[1].id,
          userId: 'harvard-player-1',
          status: 'invited',
        }
      }),
      prisma.teamChallengeParticipant.create({
        data: {
          challengeId: challenges[1].id,
          userId: 'harvard-player-3',
          status: 'joined',
          joinedAt: new Date(),
        }
      }),

      // Kimura BJJ Challenge 1 participants
      prisma.teamChallengeParticipant.create({
        data: {
          challengeId: challenges[2].id,
          userId: 'kimura-student-1',
          status: 'joined',
          joinedAt: new Date(),
        }
      }),
      prisma.teamChallengeParticipant.create({
        data: {
          challengeId: challenges[2].id,
          userId: 'kimura-student-2',
          status: 'joined',
          joinedAt: new Date(),
        }
      }),

      // Kimura BJJ Challenge 2 participants
      prisma.teamChallengeParticipant.create({
        data: {
          challengeId: challenges[3].id,
          userId: 'kimura-student-1',
          status: 'invited',
        }
      }),
      prisma.teamChallengeParticipant.create({
        data: {
          challengeId: challenges[3].id,
          userId: 'test-user-123',
          status: 'joined',
          joinedAt: new Date(),
        }
      }),
      prisma.teamChallengeParticipant.create({
        data: {
          challengeId: challenges[3].id,
          userId: 'kp_5192900f05334128b61ab2cd15f6974f',
          status: 'joined',
          joinedAt: new Date(),
        }
      }),
    ]);
    console.log(`   ✅ Created ${participants.length} challenge participants\n`);

    // 8. Create Team Recognitions
    console.log('8. Creating Team Recognitions...');
    const recognitions = await Promise.all([
      prisma.teamRecognition.create({
        data: {
          fromUserId: 'harvard-coach-1',
          toUserId: 'harvard-player-1',
          teamId: teams[0].id,
          type: 'clap',
          message: 'Great work in practice today!',
        }
      }),
      prisma.teamRecognition.create({
        data: {
          fromUserId: 'harvard-player-1',
          toUserId: 'test-user-123',
          teamId: teams[0].id,
          type: 'fire',
          message: 'Amazing hustle!',
        }
      }),
      prisma.teamRecognition.create({
        data: {
          fromUserId: 'kimura-coach-1',
          toUserId: 'kimura-student-1',
          teamId: teams[1].id,
          type: 'trophy',
          message: 'Outstanding technique!',
        }
      }),
      prisma.teamRecognition.create({
        data: {
          fromUserId: 'kimura-student-1',
          toUserId: 'test-user-123',
          teamId: teams[1].id,
          type: 'heart',
          message: 'You inspire us all!',
        }
      }),
      prisma.teamRecognition.create({
        data: {
          fromUserId: 'kimura-student-1',
          toUserId: 'test-user-123',
          teamId: teams[1].id,
          type: 'heart',
          message: 'You inspire us all!',
        }
      }),
      prisma.teamRecognition.create({
        data: {
          fromUserId: 'harvard-coach-1',
          toUserId: 'kp_5192900f05334128b61ab2cd15f6974f',
          teamId: teams[0].id,
          type: 'trophy',
          message: 'Outstanding leadership!',
        }
      }),
      prisma.teamRecognition.create({
        data: {
          fromUserId: 'kimura-coach-1',
          toUserId: 'kp_5192900f05334128b61ab2cd15f6974f',
          teamId: teams[1].id,
          type: 'fire',
          message: 'Amazing dedication!',
        }
      }),
    ]);
    console.log(`   ✅ Created ${recognitions.length} team recognitions\n`);

    // 9. Create Notifications for Recognitions
    console.log('9. Creating Notifications...');
    const notifications = await Promise.all([
      prisma.notification.create({
        data: {
          userId: 'harvard-player-1',
          message: 'Mike gave you a clap!',
          type: 'team_recognition',
          link: '/team-challenges?tab=recognition',
          actorId: 'harvard-coach-1',
          read: false,
        }
      }),
      prisma.notification.create({
        data: {
          userId: 'test-user-123',
          message: 'Alex gave you a fire!',
          type: 'team_recognition',
          link: '/team-challenges?tab=recognition',
          actorId: 'harvard-player-1',
          read: false,
        }
      }),
      prisma.notification.create({
        data: {
          userId: 'kimura-student-1',
          message: 'Carlos gave you a trophy!',
          type: 'team_recognition',
          link: '/team-challenges?tab=recognition',
          actorId: 'kimura-coach-1',
          read: false,
        }
      }),
      prisma.notification.create({
        data: {
          userId: 'test-user-123',
          message: 'Maria gave you a heart!',
          type: 'team_recognition',
          link: '/team-challenges?tab=recognition',
          actorId: 'kimura-student-1',
          read: false,
        }
      }),
      prisma.notification.create({
        data: {
          userId: 'kp_5192900f05334128b61ab2cd15f6974f',
          message: 'Mike gave you a trophy!',
          type: 'team_recognition',
          link: '/team-challenges?tab=recognition',
          actorId: 'harvard-coach-1',
          read: false,
        }
      }),
      prisma.notification.create({
        data: {
          userId: 'kp_5192900f05334128b61ab2cd15f6974f',
          message: 'Carlos gave you a fire!',
          type: 'team_recognition',
          link: '/team-challenges?tab=recognition',
          actorId: 'kimura-coach-1',
          read: false,
        }
      }),
    ]);
    console.log(`   ✅ Created ${notifications.length} notifications\n`);

    // 10. Create Quest Categories
    console.log('10. Creating Quest Categories...');
    const questCategories = await Promise.all([
      prisma.questCategory.upsert({
        where: { name: 'Fitness' },
        update: {},
        create: { name: 'Fitness' }
      }),
      prisma.questCategory.upsert({
        where: { name: 'Nutrition' },
        update: {},
        create: { name: 'Nutrition' }
      }),
      prisma.questCategory.upsert({
        where: { name: 'Mental Health' },
        update: {},
        create: { name: 'Mental Health' }
      }),
      prisma.questCategory.upsert({
        where: { name: 'Team Building' },
        update: {},
        create: { name: 'Team Building' }
      }),
      prisma.questCategory.upsert({
        where: { name: 'Skill Development' },
        update: {},
        create: { name: 'Skill Development' }
      }),
    ]);
    console.log(`   ✅ Created ${questCategories.length} quest categories\n`);

    // 11. Create Quests
    console.log('11. Creating Quests...');
    const quests = await Promise.all([
      // Fitness Quests
      prisma.quest.create({
        data: {
          title: 'Daily Steps Goal',
          description: 'Achieve 10,000 steps today',
          categoryId: questCategories[0].id,
          pointValue: 50,
        }
      }),
      prisma.quest.create({
        data: {
          title: 'Weekly Workout Streak',
          description: 'Complete 3 workouts this week',
          categoryId: questCategories[0].id,
          pointValue: 100,
        }
      }),
      prisma.quest.create({
        data: {
          title: 'Strength Training',
          description: 'Complete a strength training session',
          categoryId: questCategories[0].id,
          pointValue: 75,
        }
      }),

      // Nutrition Quests
      prisma.quest.create({
        data: {
          title: 'Hydration Hero',
          description: 'Drink 8 glasses of water today',
          categoryId: questCategories[1].id,
          pointValue: 30,
        }
      }),
      prisma.quest.create({
        data: {
          title: 'Healthy Meal Prep',
          description: 'Prepare 3 healthy meals this week',
          categoryId: questCategories[1].id,
          pointValue: 80,
        }
      }),

      // Mental Health Quests
      prisma.quest.create({
        data: {
          title: 'Mindfulness Minute',
          description: 'Practice 5 minutes of mindfulness',
          categoryId: questCategories[2].id,
          pointValue: 25,
        }
      }),
      prisma.quest.create({
        data: {
          title: 'Gratitude Journal',
          description: 'Write 3 things you\'re grateful for',
          categoryId: questCategories[2].id,
          pointValue: 40,
        }
      }),

      // Team Building Quests
      prisma.quest.create({
        data: {
          title: 'Team Cheer',
          description: 'Give encouragement to a teammate',
          categoryId: questCategories[3].id,
          pointValue: 35,
        }
      }),
      prisma.quest.create({
        data: {
          title: 'Team Challenge',
          description: 'Participate in a team challenge',
          categoryId: questCategories[3].id,
          pointValue: 60,
        }
      }),

      // Skill Development Quests
      prisma.quest.create({
        data: {
          title: 'Learn Something New',
          description: 'Learn a new skill or technique',
          categoryId: questCategories[4].id,
          pointValue: 90,
        }
      }),
      prisma.quest.create({
        data: {
          title: 'Practice Makes Perfect',
          description: 'Practice your sport for 30 minutes',
          categoryId: questCategories[4].id,
          pointValue: 55,
        }
      }),
    ]);
    console.log(`   ✅ Created ${quests.length} quests\n`);

    // 12. Create User Quests (assign quests to users)
    console.log('12. Creating User Quests...');
    const userQuests = await Promise.all([
      // Chris Dolan's quests
      prisma.userQuest.create({
        data: {
          userId: 'kp_5192900f05334128b61ab2cd15f6974f',
          questId: quests[0].id,
          status: 'assigned',
          pointsAwarded: null,
        }
      }),
      prisma.userQuest.create({
        data: {
          userId: 'kp_5192900f05334128b61ab2cd15f6974f',
          questId: quests[1].id,
          status: 'assigned',
          pointsAwarded: null,
        }
      }),
      prisma.userQuest.create({
        data: {
          userId: 'kp_5192900f05334128b61ab2cd15f6974f',
          questId: quests[4].id,
          status: 'completed',
          pointsAwarded: 80,
          completedAt: new Date(),
        }
      }),

      // Harvard Baseball players quests
      prisma.userQuest.create({
        data: {
          userId: 'harvard-player-1',
          questId: quests[0].id,
          status: 'completed',
          pointsAwarded: 50,
          completedAt: new Date(),
        }
      }),
      prisma.userQuest.create({
        data: {
          userId: 'harvard-player-2',
          questId: quests[2].id,
          status: 'assigned',
          pointsAwarded: null,
        }
      }),

      // Kimura BJJ students quests
      prisma.userQuest.create({
        data: {
          userId: 'kimura-student-1',
          questId: quests[5].id,
          status: 'completed',
          pointsAwarded: 40,
          completedAt: new Date(),
        }
      }),
      prisma.userQuest.create({
        data: {
          userId: 'kimura-student-2',
          questId: quests[9].id,
          status: 'assigned',
          pointsAwarded: null,
        }
      }),
    ]);
    console.log(`   ✅ Created ${userQuests.length} user quests\n`);

    // 13. Create User Stats for Leaderboards
    console.log('13. Creating User Stats for Leaderboards...');
    const userStats = await Promise.all([
      // Chris Dolan stats - Fitness category
      prisma.userStat.upsert({
        where: { 
          userId_categoryId: { 
            userId: 'kp_5192900f05334128b61ab2cd15f6974f', 
            categoryId: questCategories[0].id 
          } 
        },
        update: {},
        create: {
          userId: 'kp_5192900f05334128b61ab2cd15f6974f',
          categoryId: questCategories[0].id,
          points: 1250,
          level: 3,
        }
      }),

      // Harvard Baseball players stats - Fitness category
      prisma.userStat.upsert({
        where: { 
          userId_categoryId: { 
            userId: 'harvard-player-1', 
            categoryId: questCategories[0].id 
          } 
        },
        update: {},
        create: {
          userId: 'harvard-player-1',
          categoryId: questCategories[0].id,
          points: 2100,
          level: 5,
        }
      }),
      prisma.userStat.upsert({
        where: { 
          userId_categoryId: { 
            userId: 'harvard-player-2', 
            categoryId: questCategories[0].id 
          } 
        },
        update: {},
        create: {
          userId: 'harvard-player-2',
          categoryId: questCategories[0].id,
          points: 1800,
          level: 4,
        }
      }),
      prisma.userStat.upsert({
        where: { 
          userId_categoryId: { 
            userId: 'harvard-player-3', 
            categoryId: questCategories[0].id 
          } 
        },
        update: {},
        create: {
          userId: 'harvard-player-3',
          categoryId: questCategories[0].id,
          points: 950,
          level: 2,
        }
      }),

      // Kimura BJJ students stats - Fitness category
      prisma.userStat.upsert({
        where: { 
          userId_categoryId: { 
            userId: 'kimura-student-1', 
            categoryId: questCategories[0].id 
          } 
        },
        update: {},
        create: {
          userId: 'kimura-student-1',
          categoryId: questCategories[0].id,
          points: 1950,
          level: 4,
        }
      }),
      prisma.userStat.upsert({
        where: { 
          userId_categoryId: { 
            userId: 'kimura-student-2', 
            categoryId: questCategories[0].id 
          } 
        },
        update: {},
        create: {
          userId: 'kimura-student-2',
          categoryId: questCategories[0].id,
          points: 1600,
          level: 3,
        }
      }),
      prisma.userStat.upsert({
        where: { 
          userId_categoryId: { 
            userId: 'kimura-student-3', 
            categoryId: questCategories[0].id 
          } 
        },
        update: {},
        create: {
          userId: 'kimura-student-3',
          categoryId: questCategories[0].id,
          points: 1100,
          level: 2,
        }
      }),

      // Add some stats for other categories
      prisma.userStat.upsert({
        where: { 
          userId_categoryId: { 
            userId: 'kp_5192900f05334128b61ab2cd15f6974f', 
            categoryId: questCategories[1].id 
          } 
        },
        update: {},
        create: {
          userId: 'kp_5192900f05334128b61ab2cd15f6974f',
          categoryId: questCategories[1].id,
          points: 800,
          level: 2,
        }
      }),
      prisma.userStat.upsert({
        where: { 
          userId_categoryId: { 
            userId: 'harvard-player-1', 
            categoryId: questCategories[2].id 
          } 
        },
        update: {},
        create: {
          userId: 'harvard-player-1',
          categoryId: questCategories[2].id,
          points: 1200,
          level: 3,
        }
      }),
    ]);
    console.log(`   ✅ Created ${userStats.length} user stats\n`);

    console.log('🎉 Development data restored successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${sports.length} Sports`);
    console.log(`   - ${schools.length} Schools`);
    console.log(`   - ${users.length} Users`);
    console.log(`   - ${teams.length} Teams`);
    console.log(`   - ${memberships.length} Team Memberships`);
    console.log(`   - ${challenges.length} Team Challenges`);
    console.log(`   - ${participants.length} Challenge Participants`);
    console.log(`   - ${recognitions.length} Team Recognitions`);
    console.log(`   - ${notifications.length} Notifications`);
    console.log(`   - ${questCategories.length} Quest Categories`);
    console.log(`   - ${quests.length} Quests`);
    console.log(`   - ${userQuests.length} User Quests`);
    console.log(`   - ${userStats.length} User Stats`);

  } catch (error) {
    console.error('❌ Error restoring development data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreDevData(); 