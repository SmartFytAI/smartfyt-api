import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTeamChallenges() {
  console.log('🌱 Seeding team challenges gamification data...');

  try {
    // Get existing teams and users for seeding
    const teams = await prisma.team.findMany({
      take: 5,
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

    console.log(`📋 Found ${teams.length} teams for seeding`);

    // Create mock team challenges for each team
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
      {
        title: 'Skill Development',
        description: 'Learn a new skill together. Practice makes perfect!',
        type: 'skill',
        duration: 21,
        startDate: new Date(),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Team Building',
        description: 'Complete team activities together. Build camaraderie and trust!',
        type: 'team_building',
        duration: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
    ];

    console.log('🏁 Creating team challenges...');
    for (const team of teams) {
      const teamMembers = team.memberships.map(m => m.user);
      
      if (teamMembers.length === 0) {
        console.log(`⚠️  No members found for team: ${team.name}`);
        continue;
      }

      console.log(`📋 Creating challenges for team: ${team.name} with ${teamMembers.length} members`);

      for (const challengeData of mockChallenges) {
        const challenge = await prisma.teamChallenge.create({
          data: {
            ...challengeData,
            teamId: team.id,
            createdBy: teamMembers[0].id,
          },
        });

        // Add all team members as participants (some accepted, some invited)
        const participants = teamMembers.map((member, index) => ({
          challengeId: challenge.id,
          userId: member.id,
          status: index < Math.ceil(teamMembers.length / 2) ? 'accepted' : 'invited', // Half accepted, half invited
        }));

        await prisma.teamChallengeParticipant.createMany({
          data: participants,
        });

        console.log(`✅ Created challenge: ${challenge.title} for team: ${team.name}`);
      }
    }

    // Create mock recognitions for each team
    console.log('👏 Creating team recognitions...');
    for (const team of teams) {
      const teamMembers = team.memberships.map(m => m.user);
      
      if (teamMembers.length < 2) {
        console.log(`⚠️  Not enough members for recognitions in team: ${team.name}`);
        continue;
      }

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

      for (const recognitionData of mockRecognitions) {
        // Only create if we have different users
        if (recognitionData.fromUserId !== recognitionData.toUserId) {
          const recognition = await prisma.teamRecognition.create({
            data: {
              ...recognitionData,
              teamId: team.id,
            },
          });

          console.log(`✅ Created recognition: ${recognition.type} from ${recognitionData.fromUserId} to ${recognitionData.toUserId} in team: ${team.name}`);
        }
      }
    }

    // Create mock recognition interactions
    console.log('👏 Creating recognition interactions...');
    for (const team of teams) {
      const teamMembers = team.memberships.map(m => m.user);
      const recognitions = await prisma.teamRecognition.findMany({
        where: { teamId: team.id },
        take: 3,
      });

      for (const recognition of recognitions) {
        // Add interactions from different team members
        const interactionTypes = ['clap', 'heart', 'fire'];
        for (let i = 0; i < Math.min(teamMembers.length - 1, interactionTypes.length); i++) {
          const interactor = teamMembers[i + 1]; // Skip the recognition recipient
          if (interactor && interactor.id !== recognition.toUserId) {
            // Check if interaction already exists
            const existingInteraction = await prisma.recognitionInteraction.findUnique({
              where: {
                recognitionId_userId_interactionType: {
                  recognitionId: recognition.id,
                  userId: interactor.id,
                  interactionType: interactionTypes[i],
                },
              },
            });

            if (!existingInteraction) {
              const interaction = await prisma.recognitionInteraction.create({
                data: {
                  id: `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  recognitionId: recognition.id,
                  userId: interactor.id,
                  interactionType: interactionTypes[i],
                },
              });

              console.log(`✅ Created interaction: ${interaction.interactionType} from ${interactor.firstName} on recognition in team: ${team.name}`);
            }
          }
        }
      }
    }

    console.log('🎉 Team challenges gamification seeding completed!');
    console.log(`📊 Created:`);
    console.log(`   - ${teams.length * mockChallenges.length} team challenges`);
    console.log(`   - Multiple recognitions per team`);
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