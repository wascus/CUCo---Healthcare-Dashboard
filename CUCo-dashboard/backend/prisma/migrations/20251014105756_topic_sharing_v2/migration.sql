-- CreateEnum
CREATE TYPE "SharePermission" AS ENUM ('VIEW', 'COMMENT', 'EDIT');

-- DropIndex
DROP INDEX "public"."Contact_email_key";

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicShare" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "userTopicId" TEXT NOT NULL,
    "sharedWithId" TEXT,
    "groupId" TEXT,
    "permission" "SharePermission" NOT NULL DEFAULT 'VIEW',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Group_ownerId_createdAt_idx" ON "Group"("ownerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Group_ownerId_name_key" ON "Group"("ownerId", "name");

-- CreateIndex
CREATE INDEX "GroupMember_memberId_idx" ON "GroupMember"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_memberId_key" ON "GroupMember"("groupId", "memberId");

-- CreateIndex
CREATE INDEX "TopicShare_ownerId_idx" ON "TopicShare"("ownerId");

-- CreateIndex
CREATE INDEX "TopicShare_userTopicId_idx" ON "TopicShare"("userTopicId");

-- CreateIndex
CREATE INDEX "TopicShare_sharedWithId_idx" ON "TopicShare"("sharedWithId");

-- CreateIndex
CREATE INDEX "TopicShare_groupId_idx" ON "TopicShare"("groupId");

-- CreateIndex
CREATE INDEX "TopicShare_expiresAt_idx" ON "TopicShare"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_topic_direct_share" ON "TopicShare"("userTopicId", "sharedWithId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_topic_group_share" ON "TopicShare"("userTopicId", "groupId");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicShare" ADD CONSTRAINT "TopicShare_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicShare" ADD CONSTRAINT "TopicShare_userTopicId_fkey" FOREIGN KEY ("userTopicId") REFERENCES "UserTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicShare" ADD CONSTRAINT "TopicShare_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicShare" ADD CONSTRAINT "TopicShare_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
