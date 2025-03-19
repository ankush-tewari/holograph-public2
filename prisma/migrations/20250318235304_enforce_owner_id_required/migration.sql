/*
  Warnings:

  - Made the column `ownerId` on table `Holograph` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Holograph" DROP CONSTRAINT "Holograph_ownerId_fkey";

-- AlterTable
ALTER TABLE "Holograph" ALTER COLUMN "ownerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Holograph" ADD CONSTRAINT "Holograph_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
