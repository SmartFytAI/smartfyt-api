/*
  Warnings:

  - You are about to drop the column `fitnessGoals` on the `UserForm` table. All the data in the column will be lost.
  - Added the required column `athleticGoals` to the `UserForm` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeRole" TEXT NOT NULL DEFAULT 'user',
ADD COLUMN     "roles" TEXT[] DEFAULT ARRAY['']::TEXT[],
ALTER COLUMN "phone_number" DROP NOT NULL,
ALTER COLUMN "phone_number" SET DEFAULT 'placeholder';

-- AlterTable
ALTER TABLE "UserForm" DROP COLUMN "fitnessGoals",
ADD COLUMN     "athleticGoals" TEXT NOT NULL,
ADD COLUMN     "podcast" TEXT DEFAULT 'pending',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "createdAt" DROP DEFAULT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6);
