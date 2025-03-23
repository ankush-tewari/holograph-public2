-- CreateTable
CREATE TABLE "PendingPrincipalRemoval" (
    "id" TEXT NOT NULL,
    "holographId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingPrincipalRemoval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingPrincipalRemoval_holographId_targetUserId_key" ON "PendingPrincipalRemoval"("holographId", "targetUserId");

-- AddForeignKey
ALTER TABLE "PendingPrincipalRemoval" ADD CONSTRAINT "PendingPrincipalRemoval_holographId_fkey" FOREIGN KEY ("holographId") REFERENCES "Holograph"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingPrincipalRemoval" ADD CONSTRAINT "PendingPrincipalRemoval_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingPrincipalRemoval" ADD CONSTRAINT "PendingPrincipalRemoval_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
