-- CreateTable
CREATE TABLE "PersonalProperty" (
    "id" TEXT NOT NULL,
    "holographId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "nameIV" TEXT NOT NULL,
    "filePath" TEXT,
    "uploadedBy" TEXT,
    "notes" TEXT,
    "notesKey" TEXT,
    "notesIV" TEXT,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalProperty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonalProperty_holographId_filePath_key" ON "PersonalProperty"("holographId", "filePath");

-- AddForeignKey
ALTER TABLE "PersonalProperty" ADD CONSTRAINT "PersonalProperty_holographId_fkey" FOREIGN KEY ("holographId") REFERENCES "Holograph"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalProperty" ADD CONSTRAINT "PersonalProperty_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalProperty" ADD CONSTRAINT "PersonalProperty_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
