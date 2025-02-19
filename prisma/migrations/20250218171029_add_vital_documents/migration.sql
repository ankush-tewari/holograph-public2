/*
  Warnings:

  - You are about to drop the column `content` on the `Holograph` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Holograph" DROP COLUMN "content";

-- CreateTable
CREATE TABLE "VitalDocument" (
    "id" TEXT NOT NULL,
    "holographId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VitalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VitalDocument_holographId_idx" ON "VitalDocument"("holographId");

-- AddForeignKey
ALTER TABLE "VitalDocument" ADD CONSTRAINT "VitalDocument_holographId_fkey" FOREIGN KEY ("holographId") REFERENCES "Holograph"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
