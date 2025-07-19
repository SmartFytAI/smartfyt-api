-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_id_fkey";

-- AddForeignKey
ALTER TABLE "terra_users" ADD CONSTRAINT "terra_users_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
