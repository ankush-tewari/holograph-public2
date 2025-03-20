/*
  Warnings:

  - You are about to drop the column `inviteeEmail` on the `Invitation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[holographId,inviteeId]` on the table `Invitation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inviteeId` to the `Invitation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Invitation_holographId_inviteeEmail_key";

-- AlterTable
ALTER TABLE "Invitation" DROP COLUMN "inviteeEmail",
ADD COLUMN     "inviteeId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_holographId_inviteeId_key" ON "Invitation"("holographId", "inviteeId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
