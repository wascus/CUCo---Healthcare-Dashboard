import { prisma } from "../../lib/prisma";
import type { UserMilestoneDTO, MilestoneProgressDTO } from "./milestone.model";
import { toUserMilestoneDTO } from "./milestone.model";

const DEFAULT_MILESTONES = [
  {
    key: "change_pet_name",
    title: "Name Your Companion",
    description: "Change your pet's name to personalize your companion",
    rewardPoints: 10,
  },
  {
    key: "write_first_journal",
    title: "First Thought",
    description: "Write your first journal entry",
    rewardPoints: 20,
  },
  {
    key: "report_first_emotion",
    title: "First Feeling",
    description: "Track your first emotion",
    rewardPoints: 15,
  },
  {
    key: "complete_first_task",
    title: "First Achievement",
    description: "Complete your first task",
    rewardPoints: 15,
  },
  {
    key: "purchase_first_item",
    title: "First Purchase",
    description: "Purchase your first item from the shop",
    rewardPoints: 10,
  },
  {
    key: "place_first_item",
    title: "First Decoration",
    description: "Place your first item in the room",
    rewardPoints: 5,
  },
  {
    key: "write_5_journal_entries",
    title: "Journaling Habit",
    description: "Write 5 journal entries",
    rewardPoints: 50,
  },
];

async function ensureMilestonesExist(): Promise<void> {
  for (const milestone of DEFAULT_MILESTONES) {
    await prisma.milestone.upsert({
      where: { key: milestone.key },
      update: {
        rewardPoints: milestone.rewardPoints,
        title: milestone.title,
        description: milestone.description,
      },
      create: {
        key: milestone.key,
        title: milestone.title,
        description: milestone.description,
        rewardPoints: milestone.rewardPoints,
        isActive: true,
      },
    });
  }
}

async function ensureUserMilestonesExist(userId: string): Promise<void> {
  await ensureMilestonesExist();

  const activeMilestones = await prisma.milestone.findMany({
    where: { isActive: true },
  });

  for (const milestone of activeMilestones) {
    await prisma.userMilestone.upsert({
      where: {
        userId_milestoneId: {
          userId,
          milestoneId: milestone.id,
        },
      },
      update: {},
      create: {
        userId,
        milestoneId: milestone.id,
        completed: false,
        claimed: false,
      },
    });
  }
}

export async function getUserMilestones(userId: string): Promise<MilestoneProgressDTO> {
  await ensureUserMilestonesExist(userId);

  const userMilestones = await prisma.userMilestone.findMany({
    where: { userId },
    include: { milestone: true },
    orderBy: { createdAt: "asc" },
  });

  return {
    milestones: userMilestones.map(toUserMilestoneDTO),
  };
}

export async function markMilestoneCompleted(
  userId: string,
  milestoneKey: string
): Promise<UserMilestoneDTO | null> {
  const milestone = await prisma.milestone.findUnique({
    where: { key: milestoneKey },
  });

  if (!milestone) return null;

  const userMilestone = await prisma.userMilestone.update({
    where: {
      userId_milestoneId: {
        userId,
        milestoneId: milestone.id,
      },
    },
    data: {
      completed: true,
      completedAt: new Date(),
    },
    include: { milestone: true },
  });

  return toUserMilestoneDTO(userMilestone);
}

export async function claimMilestoneReward(
  userId: string,
  milestoneId: string
): Promise<{ success: boolean; rewardPoints: number }> {
  const userMilestone = await prisma.userMilestone.findUnique({
    where: {
      userId_milestoneId: {
        userId,
        milestoneId,
      },
    },
    include: { milestone: true },
  });

  if (!userMilestone) {
    throw new Error("Milestone not found");
  }

  if (!userMilestone.completed) {
    throw new Error("Milestone must be completed before claiming");
  }

  if (userMilestone.claimed) {
    throw new Error("Reward already claimed");
  }

  await prisma.userMilestone.update({
    where: {
      userId_milestoneId: {
        userId,
        milestoneId,
      },
    },
    data: {
      claimed: true,
      claimedAt: new Date(),
    },
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      balance: {
        increment: userMilestone.milestone.rewardPoints,
      },
    },
  });

  return {
    success: true,
    rewardPoints: userMilestone.milestone.rewardPoints,
  };
}

export async function checkAndUpdateMilestones(userId: string): Promise<void> {
  await ensureUserMilestonesExist(userId);

  const diaryNotes = await prisma.diaryNote.findMany({
    where: { userId },
  });

  const emotionEntries = await prisma.emotionEntry.findMany({
    where: { userId },
    take: 1,
  });

  const completedTasks = await prisma.task.findMany({
    where: { userId, completed: true },
    take: 1,
  });

  const inventoryItems = await prisma.inventoryItem.findMany({
    where: {
      userId,
      item: {
        NOT: {
          name: "Cat Bed",
        },
      },
    },
    take: 1,
    include: { item: true },
  });

  const currentUserMilestones = await prisma.userMilestone.findMany({
    where: { userId },
    include: { milestone: true },
  });

  const hasFirstDiaryEntry = diaryNotes.length > 0;
  const hasAtLeast5DiaryEntries = diaryNotes.length >= 5;
  const hasFirstEmotion = emotionEntries.length > 0;
  const hasFirstCompletedTask = completedTasks.length > 0;
  const hasFirstPurchase = inventoryItems.length > 0;

  for (const userMilestone of currentUserMilestones) {
    if (userMilestone.completed) continue;

    if (
      userMilestone.milestone.key === "write_first_journal" &&
      hasFirstDiaryEntry
    ) {
      await markMilestoneCompleted(userId, "write_first_journal");
    }

    if (
      userMilestone.milestone.key === "report_first_emotion" &&
      hasFirstEmotion
    ) {
      await markMilestoneCompleted(userId, "report_first_emotion");
    }

    if (
      userMilestone.milestone.key === "complete_first_task" &&
      hasFirstCompletedTask
    ) {
      await markMilestoneCompleted(userId, "complete_first_task");
    }

    if (
      userMilestone.milestone.key === "purchase_first_item" &&
      hasFirstPurchase
    ) {
      await markMilestoneCompleted(userId, "purchase_first_item");
    }

    if (
      userMilestone.milestone.key === "write_5_journal_entries" &&
      hasAtLeast5DiaryEntries
    ) {
      await markMilestoneCompleted(userId, "write_5_journal_entries");
    }
  }
}
