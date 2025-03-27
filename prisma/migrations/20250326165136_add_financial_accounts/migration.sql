-- CreateTable
CREATE TABLE "FinancialAccount" (
    "id" TEXT NOT NULL,
    "holographId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "nameIV" TEXT NOT NULL,
    "institution" TEXT,
    "institutionKey" TEXT,
    "institutionIV" TEXT,
    "accountType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "notes" TEXT,
    "notesKey" TEXT,
    "notesIV" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAccount_holographId_filePath_key" ON "FinancialAccount"("holographId", "filePath");

-- AddForeignKey
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_holographId_fkey" FOREIGN KEY ("holographId") REFERENCES "Holograph"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
