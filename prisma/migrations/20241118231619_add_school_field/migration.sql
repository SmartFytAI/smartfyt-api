-- AlterTable
ALTER TABLE "User" ADD COLUMN     "school" TEXT NOT NULL DEFAULT 'placeholder',
ALTER COLUMN "activeRole" SET DEFAULT 'student';

-- AlterTable
ALTER TABLE "UserForm" ADD COLUMN     "school" TEXT NOT NULL DEFAULT 'placeholder';
