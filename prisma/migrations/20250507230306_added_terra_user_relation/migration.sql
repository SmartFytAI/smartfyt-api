/*
  Warnings:

  - You are about to drop the column `school` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `activeDays` on the `UserForm` table. All the data in the column will be lost.
  - You are about to drop the column `school` on the `UserForm` table. All the data in the column will be lost.
  - You are about to drop the column `sport` on the `UserForm` table. All the data in the column will be lost.
  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `activeHours` to the `UserForm` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `sleepHours` on the `UserForm` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `studyHours` on the `UserForm` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `stress` on the `UserForm` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `screenTime` on the `UserForm` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('user', 'assistant', 'system');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "school",
ADD COLUMN     "metadata" JSONB DEFAULT '{}',
ADD COLUMN     "schoolId" TEXT,
ADD COLUMN     "stripeCurrentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "UserForm" DROP COLUMN "activeDays",
DROP COLUMN "school",
DROP COLUMN "sport",
ADD COLUMN     "activeHours" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "coachEmail" TEXT,
ADD COLUMN     "coachName" TEXT,
ADD COLUMN     "grade" TEXT NOT NULL DEFAULT 'placeholder',
ADD COLUMN     "sportID" TEXT,
ADD COLUMN     "teamID" TEXT,
DROP COLUMN "sleepHours",
ADD COLUMN     "sleepHours" DOUBLE PRECISION NOT NULL,
DROP COLUMN "studyHours",
ADD COLUMN     "studyHours" DOUBLE PRECISION NOT NULL,
DROP COLUMN "stress",
ADD COLUMN     "stress" DOUBLE PRECISION NOT NULL,
DROP COLUMN "screenTime",
ADD COLUMN     "screenTime" DOUBLE PRECISION NOT NULL;

-- DropTable
DROP TABLE "Task";

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "pointValue" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "QuestCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "pointsAwarded" INTEGER,
    "notes" VARCHAR(280),

    CONSTRAINT "UserQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalInsight" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "patterns" TEXT NOT NULL,
    "concerns" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "conversationStarters" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "s3Path" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playerStatus" TEXT NOT NULL DEFAULT 'On Track ✅',

    CONSTRAINT "JournalInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorningJournal" (
    "id" TEXT NOT NULL,
    "goalAction" TEXT NOT NULL,
    "gratitudeList" TEXT NOT NULL,
    "idealDayVision" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "MorningJournal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPerformanceMetrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "focusScore" DOUBLE PRECISION NOT NULL,
    "effortScore" DOUBLE PRECISION NOT NULL,
    "readinessScore" DOUBLE PRECISION NOT NULL,
    "motivationScore" DOUBLE PRECISION NOT NULL,
    "performanceScore" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avgActiveHours" DOUBLE PRECISION NOT NULL,
    "avgScreenTime" DOUBLE PRECISION NOT NULL,
    "avgSleepHours" DOUBLE PRECISION NOT NULL,
    "avgStress" DOUBLE PRECISION NOT NULL,
    "avgStudyHours" DOUBLE PRECISION NOT NULL,
    "metricDate" DATE NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPerformanceMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "wentWell" TEXT NOT NULL,
    "notWell" TEXT NOT NULL,
    "goals" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "response" TEXT NOT NULL DEFAULT 'pending',
    "sleepHours" DOUBLE PRECISION NOT NULL,
    "activeHours" DOUBLE PRECISION NOT NULL,
    "stress" DOUBLE PRECISION NOT NULL,
    "screenTime" DOUBLE PRECISION NOT NULL,
    "studyHours" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sportID" TEXT NOT NULL,
    "schoolID" TEXT,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "teamID" TEXT NOT NULL,
    "authorID" TEXT NOT NULL,

    CONSTRAINT "TeamPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamNotes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "philosophy" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "teamID" TEXT NOT NULL,
    "authorID" TEXT NOT NULL,

    CONSTRAINT "TeamNotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "joinedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "role" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "renewalDate" TIMESTAMP(3),
    "paymentProcessor" TEXT NOT NULL,
    "processorCustomerId" TEXT,
    "processorSubscriptionId" TEXT,
    "priceId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "canceledAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "pausedAt" TIMESTAMP(3),
    "resumesAt" TIMESTAMP(3),
    "latestInvoiceId" TEXT,
    "latestPaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "planId" TEXT,
    "stripeCurrentPeriodEnd" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripePriceId" TEXT,
    "stripeSubscriptionId" TEXT,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "features" TEXT[],
    "planType" TEXT NOT NULL DEFAULT 'individual',
    "stripePriceId" TEXT,
    "stripeProductId" TEXT,
    "trialDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "link" TEXT,
    "actorId" TEXT,
    "type" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactInquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "planType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terra_data_payloads" (
    "user_id" VARCHAR(36) NOT NULL,
    "data_type" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    "payload_id" TEXT NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,

    CONSTRAINT "terra_data_payloads_pkey" PRIMARY KEY ("user_id","created_at")
);

-- CreateTable
CREATE TABLE "terra_misc_payloads" (
    "user_id" VARCHAR(36) NOT NULL,
    "data_type" TEXT,
    "payload_type" TEXT,
    "created_at" TEXT NOT NULL,
    "payload_id" TEXT NOT NULL,

    CONSTRAINT "terra_misc_payloads_pkey" PRIMARY KEY ("user_id","created_at")
);

-- CreateTable
CREATE TABLE "terra_users" (
    "user_id" VARCHAR(36) NOT NULL,
    "reference_id" TEXT,
    "created_at" TEXT NOT NULL,
    "granted_scopes" TEXT,
    "provider" TEXT NOT NULL,
    "state" VARCHAR(20),

    CONSTRAINT "terra_users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "_SportToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SportToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Quest_categoryId_idx" ON "Quest"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestCategory_name_key" ON "QuestCategory"("name");

-- CreateIndex
CREATE INDEX "UserQuest_status_idx" ON "UserQuest"("status");

-- CreateIndex
CREATE INDEX "UserQuest_userId_idx" ON "UserQuest"("userId");

-- CreateIndex
CREATE INDEX "UserQuest_questId_idx" ON "UserQuest"("questId");

-- CreateIndex
CREATE INDEX "JournalInsight_athleteId_idx" ON "JournalInsight"("athleteId");

-- CreateIndex
CREATE INDEX "JournalInsight_teamId_idx" ON "JournalInsight"("teamId");

-- CreateIndex
CREATE INDEX "JournalInsight_weekStart_weekEnd_idx" ON "JournalInsight"("weekStart", "weekEnd");

-- CreateIndex
CREATE UNIQUE INDEX "JournalInsight_athleteId_teamId_weekStart_weekEnd_key" ON "JournalInsight"("athleteId", "teamId", "weekStart", "weekEnd");

-- CreateIndex
CREATE INDEX "UserStat_userId_idx" ON "UserStat"("userId");

-- CreateIndex
CREATE INDEX "UserStat_categoryId_idx" ON "UserStat"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStat_userId_categoryId_key" ON "UserStat"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "MorningJournal_authorId_idx" ON "MorningJournal"("authorId");

-- CreateIndex
CREATE INDEX "UserPerformanceMetrics_userId_idx" ON "UserPerformanceMetrics"("userId");

-- CreateIndex
CREATE INDEX "UserPerformanceMetrics_calculatedAt_idx" ON "UserPerformanceMetrics"("calculatedAt");

-- CreateIndex
CREATE INDEX "UserPerformanceMetrics_metricDate_idx" ON "UserPerformanceMetrics"("metricDate");

-- CreateIndex
CREATE UNIQUE INDEX "UserPerformanceMetrics_userId_metricDate_key" ON "UserPerformanceMetrics"("userId", "metricDate");

-- CreateIndex
CREATE INDEX "Journal_author_id_idx" ON "Journal"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "Team_id_key" ON "Team"("id");

-- CreateIndex
CREATE INDEX "Team_sportID_idx" ON "Team"("sportID");

-- CreateIndex
CREATE INDEX "Team_schoolID_idx" ON "Team"("schoolID");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_schoolID_key" ON "Team"("name", "schoolID");

-- CreateIndex
CREATE UNIQUE INDEX "Sport_id_key" ON "Sport"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Sport_name_key" ON "Sport"("name");

-- CreateIndex
CREATE UNIQUE INDEX "School_id_key" ON "School"("id");

-- CreateIndex
CREATE UNIQUE INDEX "School_name_key" ON "School"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TeamPost_id_key" ON "TeamPost"("id");

-- CreateIndex
CREATE INDEX "TeamPost_teamID_idx" ON "TeamPost"("teamID");

-- CreateIndex
CREATE INDEX "TeamPost_authorID_idx" ON "TeamPost"("authorID");

-- CreateIndex
CREATE UNIQUE INDEX "TeamNotes_id_key" ON "TeamNotes"("id");

-- CreateIndex
CREATE INDEX "TeamNotes_teamID_idx" ON "TeamNotes"("teamID");

-- CreateIndex
CREATE INDEX "TeamNotes_authorID_idx" ON "TeamNotes"("authorID");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembership_id_key" ON "TeamMembership"("id");

-- CreateIndex
CREATE INDEX "TeamMembership_userId_idx" ON "TeamMembership"("userId");

-- CreateIndex
CREATE INDEX "TeamMembership_teamId_idx" ON "TeamMembership"("teamId");

-- CreateIndex
CREATE INDEX "TeamMembership_sportId_idx" ON "TeamMembership"("sportId");

-- CreateIndex
CREATE INDEX "TeamMembership_role_idx" ON "TeamMembership"("role");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembership_userId_teamId_key" ON "TeamMembership"("userId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_renewalDate_idx" ON "Subscription"("renewalDate");

-- CreateIndex
CREATE INDEX "Subscription_processorSubscriptionId_idx" ON "Subscription"("processorSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_processorCustomerId_idx" ON "Subscription"("processorCustomerId");

-- CreateIndex
CREATE INDEX "Subscription_priceId_idx" ON "Subscription"("priceId");

-- CreateIndex
CREATE INDEX "Subscription_stripeSubscriptionId_idx" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Subscription_stripePriceId_idx" ON "Subscription"("stripePriceId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_stripePriceId_key" ON "SubscriptionPlan"("stripePriceId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_actorId_idx" ON "Notification"("actorId");

-- CreateIndex
CREATE INDEX "ChatSession_userId_createdAt_idx" ON "ChatSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "terra_users_reference_id_key" ON "terra_users"("reference_id");

-- CreateIndex
CREATE INDEX "terra_users_reference_id_idx" ON "terra_users"("reference_id");

-- CreateIndex
CREATE INDEX "_SportToUser_B_index" ON "_SportToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "User_schoolId_idx" ON "User"("schoolId");

-- CreateIndex
CREATE INDEX "User_stripeSubscriptionId_idx" ON "User"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "UserForm_author_id_idx" ON "UserForm"("author_id");

-- CreateIndex
CREATE INDEX "UserForm_sportID_idx" ON "UserForm"("sportID");

-- CreateIndex
CREATE INDEX "UserForm_teamID_idx" ON "UserForm"("teamID");

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "QuestCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuest" ADD CONSTRAINT "UserQuest_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuest" ADD CONSTRAINT "UserQuest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalInsight" ADD CONSTRAINT "JournalInsight_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalInsight" ADD CONSTRAINT "JournalInsight_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStat" ADD CONSTRAINT "UserStat_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "QuestCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStat" ADD CONSTRAINT "UserStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_id_fkey" FOREIGN KEY ("id") REFERENCES "terra_users"("reference_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningJournal" ADD CONSTRAINT "MorningJournal_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPerformanceMetrics" ADD CONSTRAINT "UserPerformanceMetrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserForm" ADD CONSTRAINT "UserForm_sportID_fkey" FOREIGN KEY ("sportID") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserForm" ADD CONSTRAINT "UserForm_teamID_fkey" FOREIGN KEY ("teamID") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_schoolID_fkey" FOREIGN KEY ("schoolID") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_sportID_fkey" FOREIGN KEY ("sportID") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPost" ADD CONSTRAINT "TeamPost_authorID_fkey" FOREIGN KEY ("authorID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPost" ADD CONSTRAINT "TeamPost_teamID_fkey" FOREIGN KEY ("teamID") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamNotes" ADD CONSTRAINT "TeamNotes_authorID_fkey" FOREIGN KEY ("authorID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamNotes" ADD CONSTRAINT "TeamNotes_teamID_fkey" FOREIGN KEY ("teamID") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SportToUser" ADD CONSTRAINT "_SportToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Sport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SportToUser" ADD CONSTRAINT "_SportToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
