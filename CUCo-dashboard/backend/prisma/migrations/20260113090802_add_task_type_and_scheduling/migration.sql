-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('SHORT_TERM', 'LONG_TERM');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "scheduledDate" TIMESTAMP(3),
ADD COLUMN     "scheduledTime" TEXT,
ADD COLUMN     "taskType" "TaskType" NOT NULL DEFAULT 'LONG_TERM';

-- CreateIndex
CREATE INDEX "Task_userId_taskType_idx" ON "Task"("userId", "taskType");
