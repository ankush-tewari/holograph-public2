/*
  Warnings:

  - Made the column `geography` on table `Holograph` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Holograph" ADD COLUMN     "aesKeyPath" TEXT,
ALTER COLUMN "geography" SET NOT NULL;
