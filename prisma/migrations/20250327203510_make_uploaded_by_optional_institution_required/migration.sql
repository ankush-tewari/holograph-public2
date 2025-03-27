/*
  Warnings:

  - Made the column `institution` on table `FinancialAccount` required. This step will fail if there are existing NULL values in that column.
  - Made the column `institutionKey` on table `FinancialAccount` required. This step will fail if there are existing NULL values in that column.
  - Made the column `institutionIV` on table `FinancialAccount` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "FinancialAccount" ALTER COLUMN "institution" SET NOT NULL,
ALTER COLUMN "institutionKey" SET NOT NULL,
ALTER COLUMN "institutionIV" SET NOT NULL,
ALTER COLUMN "uploadedBy" DROP NOT NULL;
