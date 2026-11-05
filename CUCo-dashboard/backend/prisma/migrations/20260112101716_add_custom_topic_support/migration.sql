-- AlterTable
ALTER TABLE "UserTopic" ADD COLUMN     "customTitle" TEXT,
ALTER COLUMN "topicId" DROP NOT NULL;
