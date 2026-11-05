-- CreateEnum
CREATE TYPE "EmotionName" AS ENUM ('Joy', 'Sadness', 'Anger', 'Fear', 'Hope', 'Love', 'Guilt', 'Acceptance', 'Confusion', 'Gratitude');

-- CreateTable
CREATE TABLE "EmotionEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emotion" "EmotionName" NOT NULL,
    "color" TEXT NOT NULL,
    "intensity" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmotionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmotionEntry_userId_createdAt_idx" ON "EmotionEntry"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "EmotionEntry" ADD CONSTRAINT "EmotionEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
