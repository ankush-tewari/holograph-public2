/*
  Warnings:

  - Added the required column `nameIV` to the `VitalDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameKey` to the `VitalDocument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VitalDocument" ADD COLUMN     "nameIV" TEXT NOT NULL,
ADD COLUMN     "nameKey" TEXT NOT NULL,
ADD COLUMN     "notesIV" TEXT,
ADD COLUMN     "notesKey" TEXT;
