/*
  Warnings:

  - A unique constraint covering the columns `[ownerId,email]` on the table `Contact` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Contact_ownerId_idx";

-- AlterTable
ALTER TABLE "UserTopic" ADD COLUMN     "description" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Contact_ownerId_email_key" ON "Contact"("ownerId", "email");
