/*
  Warnings:

  - A unique constraint covering the columns `[holographId,filePath]` on the table `VitalDocument` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "VitalDocument_holographId_filePath_key" ON "VitalDocument"("holographId", "filePath");
