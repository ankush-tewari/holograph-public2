/*
  Warnings:

  - You are about to drop the column `section` on the `DelegatePermissions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[holographId,delegateId,sectionId]` on the table `DelegatePermissions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sectionId` to the `DelegatePermissions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DelegatePermissions_holographId_delegateId_section_key";

-- AlterTable
ALTER TABLE "DelegatePermissions" DROP COLUMN "section",
ADD COLUMN     "sectionId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DelegatePermissions_holographId_delegateId_sectionId_key" ON "DelegatePermissions"("holographId", "delegateId", "sectionId");

-- AddForeignKey
ALTER TABLE "DelegatePermissions" ADD CONSTRAINT "DelegatePermissions_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "HolographSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
