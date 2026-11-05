import type { Streak } from "@prisma/client";

export type StreakDTO = {
  id: string;
  userId: string;
  currentStreak: number;
  maxStreak: number;
  lastActivityDate: string | null;
  streakStartDate: string | null;
  multiplier: number;
  createdAt: string;
  updatedAt: string;
};

export type StreakStats = {
  currentStreak: number;
  maxStreak: number;
  multiplier: number;
  lastActivityDate: string | null;
  daysUntilReset: number | null;
};

export function toDTO(row: Streak): StreakDTO {
  return {
    id: row.id,
    userId: row.userId,
    currentStreak: row.currentStreak,
    maxStreak: row.maxStreak,
    lastActivityDate: row.lastActivityDate?.toISOString() || null,
    streakStartDate: row.streakStartDate?.toISOString() || null,
    multiplier: getMultiplier(row.currentStreak),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function getMultiplier(currentStreak: number): number {
  if (currentStreak > 7) return 3.0;
  if (currentStreak >= 5) return 2.0;
  if (currentStreak >= 2) return 1.5;
  return 1.0;
}

export const streakSchema: any = {
  type: "object",
  required: ["id", "userId", "currentStreak", "maxStreak", "multiplier"],
  properties: {
    id: { type: "string" },
    userId: { type: "string" },
    currentStreak: { type: "integer" },
    maxStreak: { type: "integer" },
    multiplier: { type: "number" },
    lastActivityDate: { type: ["string", "null"] },
    streakStartDate: { type: ["string", "null"] },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
};

export const streakStatsSchema: any = {
  type: "object",
  required: ["currentStreak", "maxStreak", "multiplier"],
  properties: {
    currentStreak: { type: "integer" },
    maxStreak: { type: "integer" },
    multiplier: { type: "number" },
    lastActivityDate: { type: ["string", "null"] },
    daysUntilReset: { type: ["integer", "null"] },
  },
};
