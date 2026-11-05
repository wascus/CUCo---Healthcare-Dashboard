import { apiFetch } from './api';

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

export type StreakCheckResponse = {
  streak: StreakDTO;
  stats: StreakStats;
};

export async function getStreakStats(): Promise<StreakStats> {
  return apiFetch<StreakStats>('/v1/gamification/streak/stats');
}

export async function getStreak(): Promise<StreakDTO> {
  return apiFetch<StreakDTO>('/v1/gamification/streak');
}

export async function checkAndUpdateStreak(): Promise<StreakCheckResponse> {
  return apiFetch<StreakCheckResponse>('/v1/gamification/streak/check', {
    method: 'POST',
  });
}

export async function getMultiplier(): Promise<{ multiplier: number }> {
  return apiFetch<{ multiplier: number }>('/v1/gamification/streak/multiplier');
}

export async function getAllStreaks(): Promise<StreakDTO[]> {
  return apiFetch<StreakDTO[]>('/v1/gamification/streak/all');
}
