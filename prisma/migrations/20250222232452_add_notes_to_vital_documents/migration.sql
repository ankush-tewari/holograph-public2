/*
  Warnings:

  - Added the required column `filePath` to the `VitalDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedBy` to the `VitalDocument` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "VitalDocument_holographId_idx";

-- AlterTable
ALTER TABLE "VitalDocument" ADD COLUMN     "filePath" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "uploadedBy" TEXT NOT NULL;
