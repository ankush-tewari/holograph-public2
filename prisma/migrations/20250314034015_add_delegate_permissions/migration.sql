-- CreateTable
CREATE TABLE "DelegatePermissions" (
    "id" TEXT NOT NULL,
    "holographId" TEXT NOT NULL,
    "delegateId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,

    CONSTRAINT "DelegatePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DelegatePermissions_holographId_delegateId_section_key" ON "DelegatePermissions"("holographId", "delegateId", "section");

-- AddForeignKey
ALTER TABLE "DelegatePermissions" ADD CONSTRAINT "DelegatePermissions_holographId_fkey" FOREIGN KEY ("holographId") REFERENCES "Holograph"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DelegatePermissions" ADD CONSTRAINT "DelegatePermissions_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
