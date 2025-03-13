-- CreateTable
CREATE TABLE "HolographSection" (
    "id" TEXT NOT NULL,
    "holographId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "HolographSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HolographSection_holographId_sectionId_key" ON "HolographSection"("holographId", "sectionId");

-- AddForeignKey
ALTER TABLE "HolographSection" ADD CONSTRAINT "HolographSection_holographId_fkey" FOREIGN KEY ("holographId") REFERENCES "Holograph"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HolographSection" ADD CONSTRAINT "HolographSection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
