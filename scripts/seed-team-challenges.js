const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTeamChallenges() {
  console.log('🌱 Seeding team challenges gamification data...');

  try {
    // Get existing teams and users for seeding
    const teams = await prisma.team.findMany({
      take: 3,
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (teams.length === 0) {
      console.log('⚠️  No teams found. Please create teams first.');
      return;
    }

    const team = teams[0];
    const teamMembers = team.memberships.map(m => m.user);
    
    if (teamMembers.length === 0) {
      console.log('⚠️  No team members found. Please add users to teams first.');
      return;
    }

    console.log(`📋 Using team: ${team.name} with ${teamMembers.length} members`);

    // Create mock team quests
    const mockQuests = [
      {
        title: 'Team Strength Challenge',
        description: 'Complete 100 push-ups as a team this week. Each member should do their fair share!',
        category: 'strength',
        difficulty: 'medium',
        pointValue: 75,
        duration: 'weekly',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        title: 'Endurance Run',
        description: 'Run 5 miles together as a team. Track your progress and encourage each other!',
        category: 'endurance',
        difficulty: 'hard',
        pointValue: 100,
        duration: 'weekly',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Daily Hydration',
        description: 'Drink 8 glasses of water daily. Stay hydrated for peak performance!',
        category: 'health',
        difficulty: 'easy',
        pointValue: 25,
        duration: 'daily',
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      },
      {
        title: 'Team Building Exercise',
        description: 'Complete a team workout session together. Build camaraderie and strength!',
        category: 'team_building',
        difficulty: 'medium',
        pointValue: 60,
        duration: 'weekly',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ];

    console.log('🏆 Creating team quests...');
    for (const questData of mockQuests) {
      const quest = await prisma.teamQuest.create({
        data: {
          ...questData,
          teamId: team.id,
          createdBy: teamMembers[0].id,
        },
      });

      // Assign quest to all team members
      const assignments = teamMembers.map(member => ({
        questId: quest.id,
        userId: member.id,
      }));

      await prisma.teamQuestAssignment.createMany({
        data: assignments,
      });

      console.log(`✅ Created quest: ${quest.title}`);
    }

    // Create mock team challenges
    const mockChallenges = [
      {
        title: 'Step Competition',
        description: 'Who can get the most steps this week? Track your daily steps and compete!',
        type: 'step_competition',
        duration: 7,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Workout Warriors',
        description: 'Complete 3 workouts this week. Share your progress and motivate each other!',
        type: 'workout',
        duration: 7,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Habit Tracker',
        description: 'Build a new healthy habit together. Consistency is key!',
        type: 'habit',
        duration: 14,
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    ];

    console.log('🏁 Creating team challenges...');
    for (const challengeData of mockChallenges) {
      const challenge = await prisma.teamChallenge.create({
        data: {
          ...challengeData,
          teamId: team.id,
          createdBy: teamMembers[0].id,
        },
      });

      // Add all team members as participants
      const participants = teamMembers.map(member => ({
        challengeId: challenge.id,
        userId: member.id,
        status: 'invited',
      }));

      await prisma.teamChallengeParticipant.createMany({
        data: participants,
      });

      console.log(`✅ Created challenge: ${challenge.title}`);
    }

    // Create mock recognitions
    const mockRecognitions = [
      {
        fromUserId: teamMembers[0].id,
        toUserId: teamMembers[1]?.id || teamMembers[0].id,
        type: 'clap',
        message: 'Great job on the workout today! You really pushed through!',
      },
      {
        fromUserId: teamMembers[1]?.id || teamMembers[0].id,
        toUserId: teamMembers[2]?.id || teamMembers[0].id,
        type: 'fire',
        message: 'You crushed that challenge! Amazing performance!',
      },
      {
        fromUserId: teamMembers[2]?.id || teamMembers[0].id,
        toUserId: teamMembers[0].id,
        type: 'heart',
        message: 'Thanks for being such a great teammate and leader!',
      },
      {
        fromUserId: teamMembers[0].id,
        toUserId: teamMembers[1]?.id || teamMembers[0].id,
        type: 'flex',
        message: 'Your dedication to the team is inspiring!',
      },
    ];

    console.log('👏 Creating team recognitions...');
    for (const recognitionData of mockRecognitions) {
      // Only create if we have different users
      if (recognitionData.fromUserId !== recognitionData.toUserId) {
        const recognition = await prisma.teamRecognition.create({
          data: {
            ...recognitionData,
            teamId: team.id,
          },
        });

        console.log(`✅ Created recognition: ${recognition.type} from ${recognitionData.fromUserId} to ${recognitionData.toUserId}`);
      }
    }

    // Create some quest completions
    console.log('✅ Creating quest completions...');
    const quests = await prisma.teamQuest.findMany({
      where: { teamId: team.id },
      take: 2,
    });

    for (const quest of quests) {
      const completion = await prisma.teamQuestCompletion.create({
        data: {
          questId: quest.id,
          userId: teamMembers[0].id,
          notes: 'Completed this quest successfully! Great team effort.',
          evidence: 'https://example.com/evidence.jpg',
        },
      });

      // Update assignment status
      await prisma.teamQuestAssignment.update({
        where: {
          questId_userId: {
            questId: quest.id,
            userId: teamMembers[0].id,
          },
        },
        data: {
          status: 'completed',
        },
      });

      console.log(`✅ Created completion for quest: ${quest.title}`);
    }

    // Create mock recognition interactions
    console.log('👏 Creating recognition interactions...');
    const recognitions = await prisma.teamRecognition.findMany({
      where: { teamId: team.id },
      take: 2,
    });

    for (const recognition of recognitions) {
      // Add interactions from different team members
      const interactionTypes = ['clap', 'heart', 'fire'];
      for (let i = 0; i < Math.min(teamMembers.length - 1, interactionTypes.length); i++) {
        const interactor = teamMembers[i + 1]; // Skip the recognition recipient
        if (interactor && interactor.id !== recognition.toUserId) {
          const interaction = await prisma.recognitionInteraction.create({
            data: {
              recognitionId: recognition.id,
              userId: interactor.id,
              interactionType: interactionTypes[i],
            },
          });

          console.log(`✅ Created interaction: ${interaction.interactionType} from ${interactor.firstName} on recognition`);
        }
      }
    }

    console.log('🎉 Team challenges gamification seeding completed!');
    console.log(`📊 Created:`);
    console.log(`   - ${mockQuests.length} team quests`);
    console.log(`   - ${mockChallenges.length} team challenges`);
    console.log(`   - ${mockRecognitions.length} recognitions`);
    console.log(`   - 2 quest completions`);
    console.log(`   - Multiple recognition interactions`);

  } catch (error) {
    console.error('❌ Error seeding team challenges:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedTeamChallenges()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }); 