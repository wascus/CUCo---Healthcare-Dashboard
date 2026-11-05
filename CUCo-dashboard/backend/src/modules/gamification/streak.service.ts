import { prisma } from "../../lib/prisma";
import type { StreakDTO, StreakStats } from "./streak.model";
import { toDTO, getMultiplier } from "./streak.model";

const STREAK_INTERVAL_MS = 60 * 1000;

function isNewInterval(date: Date | null): boolean {
  if (!date) return true;
  const now = new Date();
  const lastDate = new Date(date);
  const diff = now.getTime() - lastDate.getTime();
  return diff >= STREAK_INTERVAL_MS;
}

function isPreviousInterval(date: Date | null): boolean {
  if (!date) return false;
  const now = new Date();
  const lastDate = new Date(date);
  const diff = now.getTime() - lastDate.getTime();
  return diff >= STREAK_INTERVAL_MS && diff < 2 * STREAK_INTERVAL_MS;
}

export async function getOrCreateStreak(userId: string): Promise<StreakDTO> {
  let streak = await prisma.streak.findUnique({
    where: { userId },
  });

  if (!streak) {
    streak = await prisma.streak.create({
      data: {
        userId,
        currentStreak: 0,
        maxStreak: 0,
      },
    });
  }

  return toDTO(streak);
}

export async function updateStreak(userId: string): Promise<StreakDTO> {
  let streak = await prisma.streak.findUnique({
    where: { userId },
  });

  const now = new Date();

  if (!streak) {
    streak = await prisma.streak.create({
      data: {
        userId,
        currentStreak: 1,
        maxStreak: 1,
        lastActivityDate: now,
        streakStartDate: now,
      },
    });
    return toDTO(streak);
  }

  // Check if streak should be reset (1+ minute of inactivity)
  if (isNewInterval(streak.lastActivityDate)) {
    const updated = await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        maxStreak: Math.max(streak.maxStreak, 1),
        lastActivityDate: now,
        streakStartDate: now,
      },
    });
    return toDTO(updated);
  }

  // Calculate minutes elapsed since streak started
  const streakStart = new Date(streak.streakStartDate || now);
  const minutesElapsed = Math.floor((now.getTime() - streakStart.getTime()) / STREAK_INTERVAL_MS);
  const newCurrentStreak = Math.max(1, minutesElapsed + 1);

  const newMaxStreak = Math.max(streak.maxStreak, newCurrentStreak);

  const updated = await prisma.streak.update({
    where: { userId },
    data: {
      currentStreak: newCurrentStreak,
      maxStreak: newMaxStreak,
      lastActivityDate: now,
    },
  });

  return toDTO(updated);
}

export async function getStreakStats(userId: string): Promise<StreakStats> {
  let streak = await getOrCreateStreak(userId);

  // Check if streak should be reset due to inactivity
  if (streak.lastActivityDate && isNewInterval(new Date(streak.lastActivityDate))) {
    const updated = await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        maxStreak: Math.max(streak.maxStreak, 1),
        streakStartDate: new Date(),
      },
    });
    streak = toDTO(updated);
  }

  let daysUntilReset: number | null = null;
  if (streak.lastActivityDate) {
    const now = new Date();
    const lastDate = new Date(streak.lastActivityDate);
    const timeSinceLastActivity = now.getTime() - lastDate.getTime();
    const minutesUntilReset = Math.ceil((STREAK_INTERVAL_MS - timeSinceLastActivity) / (1000 * 60));
    daysUntilReset = Math.max(0, minutesUntilReset);
  }

  return {
    currentStreak: streak.currentStreak,
    maxStreak: streak.maxStreak,
    multiplier: getMultiplier(streak.currentStreak),
    lastActivityDate: streak.lastActivityDate,
    daysUntilReset,
  };
}

export async function getMultiplierForUser(userId: string): Promise<number> {
  const streak = await getOrCreateStreak(userId);
  return getMultiplier(streak.currentStreak);
}

export async function resetStreakIfNeeded(userId: string): Promise<void> {
  const streak = await prisma.streak.findUnique({
    where: { userId },
  });

  if (!streak) return;

  if (streak.lastActivityDate && !isPreviousInterval(streak.lastActivityDate) && isNewInterval(streak.lastActivityDate)) {
    await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: 0,
      },
    });
  }
}

export async function getAllStreaks(): Promise<StreakDTO[]> {
  const streaks = await prisma.streak.findMany({
    orderBy: { currentStreak: "desc" },
  });

  return streaks.map(toDTO);
}
