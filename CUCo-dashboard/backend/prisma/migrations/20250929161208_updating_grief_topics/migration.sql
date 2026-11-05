/*
  Warnings:

  - You are about to drop the `Topic` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TopicToUserTopic` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_TopicToUserTopic" DROP CONSTRAINT "_TopicToUserTopic_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_TopicToUserTopic" DROP CONSTRAINT "_TopicToUserTopic_B_fkey";

-- DropTable
DROP TABLE "public"."Topic";

-- DropTable
DROP TABLE "public"."_TopicToUserTopic";

-- DropEnum
DROP TYPE "public"."NoteType";
