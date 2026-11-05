// modules/testsOverview/testsOverview.service.ts
import { prisma } from "../../lib/prisma";
import type { EmotionName } from "@prisma/client";

export type EmotionRow = {
  id: string;
  userId: string;
  emotion: EmotionName; // Prisma enum
  color: string;
  intensity: number;
  note: string | null;
  createdAt: Date;
};

export const testsOverviewService = {
  async list(userId: string, limit: number): Promise<EmotionRow[]> {
    return prisma.emotionEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: Math.max(1, Math.min(limit || 50, 200)),
    });
  },

  async create(
    userId: string,
    input: {
      emotion: EmotionName;
      color: string;
      intensity: number;
      note?: string | null;
    }
  ): Promise<EmotionRow> {
    const { emotion, color, intensity, note = null } = input;

    // Optional sanity checks
    if (intensity < 1 || intensity > 10) {
      throw Object.assign(new Error("Intensity must be between 1 and 10"), { status: 400 });
    }

    const row = await prisma.emotionEntry.create({
      data: { userId, emotion, color, intensity, note },
    });

    return row;
  },
};
