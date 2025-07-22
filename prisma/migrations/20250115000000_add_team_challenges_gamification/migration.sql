-- CreateTable
CREATE TABLE "TeamQuest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "pointValue" INTEGER NOT NULL DEFAULT 50,
    "duration" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamQuestAssignment" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'assigned',

    CONSTRAINT "TeamQuestAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamQuestCompletion" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" VARCHAR(280),
    "evidence" TEXT,

    CONSTRAINT "TeamQuestCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamChallenge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamChallengeParticipant" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'invited',
    "joinedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TeamChallengeParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRecognition" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamRecognition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRecognitionLimit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "clapsUsed" INTEGER NOT NULL DEFAULT 0,
    "firesUsed" INTEGER NOT NULL DEFAULT 0,
    "heartsUsed" INTEGER NOT NULL DEFAULT 0,
    "flexesUsed" INTEGER NOT NULL DEFAULT 0,
    "zapsUsed" INTEGER NOT NULL DEFAULT 0,
    "trophiesUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRecognitionLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamQuest_teamId_idx" ON "TeamQuest"("teamId");

-- CreateIndex
CREATE INDEX "TeamQuest_createdBy_idx" ON "TeamQuest"("createdBy");

-- CreateIndex
CREATE INDEX "TeamQuest_isActive_idx" ON "TeamQuest"("isActive");

-- CreateIndex
CREATE INDEX "TeamQuestAssignment_questId_idx" ON "TeamQuestAssignment"("questId");

-- CreateIndex
CREATE INDEX "TeamQuestAssignment_userId_idx" ON "TeamQuestAssignment"("userId");

-- CreateIndex
CREATE INDEX "TeamQuestAssignment_status_idx" ON "TeamQuestAssignment"("status");

-- CreateIndex
CREATE INDEX "TeamQuestCompletion_questId_idx" ON "TeamQuestCompletion"("questId");

-- CreateIndex
CREATE INDEX "TeamQuestCompletion_userId_idx" ON "TeamQuestCompletion"("userId");

-- CreateIndex
CREATE INDEX "TeamChallenge_teamId_idx" ON "TeamChallenge"("teamId");

-- CreateIndex
CREATE INDEX "TeamChallenge_createdBy_idx" ON "TeamChallenge"("createdBy");

-- CreateIndex
CREATE INDEX "TeamChallenge_isActive_idx" ON "TeamChallenge"("isActive");

-- CreateIndex
CREATE INDEX "TeamChallengeParticipant_challengeId_idx" ON "TeamChallengeParticipant"("challengeId");

-- CreateIndex
CREATE INDEX "TeamChallengeParticipant_userId_idx" ON "TeamChallengeParticipant"("userId");

-- CreateIndex
CREATE INDEX "TeamChallengeParticipant_status_idx" ON "TeamChallengeParticipant"("status");

-- CreateIndex
CREATE INDEX "TeamRecognition_fromUserId_idx" ON "TeamRecognition"("fromUserId");

-- CreateIndex
CREATE INDEX "TeamRecognition_toUserId_idx" ON "TeamRecognition"("toUserId");

-- CreateIndex
CREATE INDEX "TeamRecognition_teamId_idx" ON "TeamRecognition"("teamId");

-- CreateIndex
CREATE INDEX "TeamRecognition_type_idx" ON "TeamRecognition"("type");

-- CreateIndex
CREATE INDEX "UserRecognitionLimit_userId_idx" ON "UserRecognitionLimit"("userId");

-- CreateIndex
CREATE INDEX "UserRecognitionLimit_date_idx" ON "UserRecognitionLimit"("date");

-- CreateIndex
CREATE UNIQUE INDEX "TeamQuestAssignment_questId_userId_key" ON "TeamQuestAssignment"("questId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamChallengeParticipant_challengeId_userId_key" ON "TeamChallengeParticipant"("challengeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRecognitionLimit_userId_date_key" ON "UserRecognitionLimit"("userId", "date");

-- AddForeignKey
ALTER TABLE "TeamQuest" ADD CONSTRAINT "TeamQuest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamQuest" ADD CONSTRAINT "TeamQuest_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamQuestAssignment" ADD CONSTRAINT "TeamQuestAssignment_questId_fkey" FOREIGN KEY ("questId") REFERENCES "TeamQuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamQuestAssignment" ADD CONSTRAINT "TeamQuestAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamQuestCompletion" ADD CONSTRAINT "TeamQuestCompletion_questId_fkey" FOREIGN KEY ("questId") REFERENCES "TeamQuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamQuestCompletion" ADD CONSTRAINT "TeamQuestCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChallenge" ADD CONSTRAINT "TeamChallenge_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChallenge" ADD CONSTRAINT "TeamChallenge_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChallengeParticipant" ADD CONSTRAINT "TeamChallengeParticipant_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "TeamChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChallengeParticipant" ADD CONSTRAINT "TeamChallengeParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRecognition" ADD CONSTRAINT "TeamRecognition_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRecognition" ADD CONSTRAINT "TeamRecognition_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRecognition" ADD CONSTRAINT "TeamRecognition_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRecognitionLimit" ADD CONSTRAINT "UserRecognitionLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "RecognitionInteraction" (
    "id" TEXT NOT NULL,
    "recognitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecognitionInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecognitionInteraction_recognitionId_idx" ON "RecognitionInteraction"("recognitionId");

-- CreateIndex
CREATE INDEX "RecognitionInteraction_userId_idx" ON "RecognitionInteraction"("userId");

-- CreateIndex
CREATE INDEX "RecognitionInteraction_interactionType_idx" ON "RecognitionInteraction"("interactionType");

-- CreateIndex
CREATE UNIQUE INDEX "RecognitionInteraction_recognitionId_userId_interactionType_key" ON "RecognitionInteraction"("recognitionId", "userId", "interactionType");

-- AddForeignKey
ALTER TABLE "RecognitionInteraction" ADD CONSTRAINT "RecognitionInteraction_recognitionId_fkey" FOREIGN KEY ("recognitionId") REFERENCES "TeamRecognition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecognitionInteraction" ADD CONSTRAINT "RecognitionInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; 