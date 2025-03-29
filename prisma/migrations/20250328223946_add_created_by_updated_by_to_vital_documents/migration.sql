/*
  Warnings:

  - Added the required column `createdBy` to the `VitalDocument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VitalDocument" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "updatedBy" TEXT;

-- AddForeignKey
ALTER TABLE "VitalDocument" ADD CONSTRAINT "VitalDocument_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalDocument" ADD CONSTRAINT "VitalDocument_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
