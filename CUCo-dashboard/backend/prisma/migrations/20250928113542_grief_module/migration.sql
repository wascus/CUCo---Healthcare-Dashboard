/*
  Warnings:

  - You are about to drop the column `noteType` on the `DiaryNote` table. All the data in the column will be lost.
  - You are about to drop the column `response` on the `UserTopic` table. All the data in the column will be lost.
  - Added the required column `kind` to the `DiaryNote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UserTopic` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Placement" AS ENUM ('BASE', 'MIDDLE', 'SUMMIT');

-- CreateEnum
CREATE TYPE "public"."TopicStatus" AS ENUM ('TEXT', 'CHECK', 'TEAR', 'IMAGE');

-- CreateEnum
CREATE TYPE "public"."NoteKind" AS ENUM ('POSITIVE', 'EMOTIONAL');

-- DropForeignKey
ALTER TABLE "public"."DiaryNote" DROP CONSTRAINT "DiaryNote_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserTopic" DROP CONSTRAINT "UserTopic_topicId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserTopic" DROP CONSTRAINT "UserTopic_userId_fkey";

-- DropIndex
DROP INDEX "public"."DiaryNote_userId_createdAt_idx";

-- AlterTable
ALTER TABLE "public"."DiaryNote" DROP COLUMN "noteType",
ADD COLUMN     "kind" "public"."NoteKind" NOT NULL;

-- AlterTable
ALTER TABLE "public"."UserTopic" DROP COLUMN "response",
ADD COLUMN     "date" TIMESTAMP(3),
ADD COLUMN     "placement" "public"."Placement" NOT NULL DEFAULT 'BASE',
ADD COLUMN     "shared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "public"."TopicStatus" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "public"."GriefTopic" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "promptText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GriefTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_TopicToUserTopic" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TopicToUserTopic_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "GriefTopic_key_key" ON "public"."GriefTopic"("key");

-- CreateIndex
CREATE INDEX "_TopicToUserTopic_B_index" ON "public"."_TopicToUserTopic"("B");

-- AddForeignKey
ALTER TABLE "public"."UserTopic" ADD CONSTRAINT "UserTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserTopic" ADD CONSTRAINT "UserTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."GriefTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiaryNote" ADD CONSTRAINT "DiaryNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_TopicToUserTopic" ADD CONSTRAINT "_TopicToUserTopic_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_TopicToUserTopic" ADD CONSTRAINT "_TopicToUserTopic_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."UserTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
