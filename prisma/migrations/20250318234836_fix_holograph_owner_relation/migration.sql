-- AlterTable
ALTER TABLE "Holograph" ADD COLUMN     "ownerId" TEXT;

-- CreateTable
CREATE TABLE "OwnershipAuditLog" (
    "id" TEXT NOT NULL,
    "holographId" TEXT NOT NULL,
    "oldOwnerId" TEXT,
    "currentOwnerId" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnershipAuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Holograph" ADD CONSTRAINT "Holograph_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipAuditLog" ADD CONSTRAINT "OwnershipAuditLog_holographId_fkey" FOREIGN KEY ("holographId") REFERENCES "Holograph"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipAuditLog" ADD CONSTRAINT "OwnershipAuditLog_oldOwnerId_fkey" FOREIGN KEY ("oldOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipAuditLog" ADD CONSTRAINT "OwnershipAuditLog_currentOwnerId_fkey" FOREIGN KEY ("currentOwnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
