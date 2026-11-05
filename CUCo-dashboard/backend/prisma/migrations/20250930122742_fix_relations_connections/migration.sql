-- CreateEnum
CREATE TYPE "public"."RelationshipType" AS ENUM ('BEST_FRIEND', 'GOOD_FRIEND', 'PARTNER', 'PARENT', 'CHILD', 'SIBLING', 'AUNT_UNCLE', 'COUSIN', 'THERAPIST', 'DOCTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AccessLevel" AS ENUM ('NONE', 'POSITIVE_ONLY', 'NEGATIVE_ONLY', 'FULL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'BLOCKED', 'REVOKED');

-- CreateTable
CREATE TABLE "public"."Contact" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Connection" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "contactId" TEXT,
    "relationship" "public"."RelationshipType" NOT NULL DEFAULT 'OTHER',
    "accessLevel" "public"."AccessLevel" NOT NULL DEFAULT 'NONE',
    "status" "public"."ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "label" TEXT,
    "tags" TEXT[],
    "invitedVia" TEXT,
    "inviteToken" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contact_email_key" ON "public"."Contact"("email");

-- CreateIndex
CREATE INDEX "Contact_ownerId_idx" ON "public"."Contact"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_inviteToken_key" ON "public"."Connection"("inviteToken");

-- CreateIndex
CREATE INDEX "Connection_ownerId_createdAt_idx" ON "public"."Connection"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "Connection_targetUserId_idx" ON "public"."Connection"("targetUserId");

-- CreateIndex
CREATE INDEX "Connection_contactId_idx" ON "public"."Connection"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_owner_target_user" ON "public"."Connection"("ownerId", "targetUserId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_owner_contact" ON "public"."Connection"("ownerId", "contactId");

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Connection" ADD CONSTRAINT "Connection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Connection" ADD CONSTRAINT "Connection_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Connection" ADD CONSTRAINT "Connection_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
