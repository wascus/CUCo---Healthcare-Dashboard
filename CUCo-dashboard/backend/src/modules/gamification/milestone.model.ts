import type { Milestone, UserMilestone } from "@prisma/client";

export interface MilestoneDTO {
  id: string;
  key: string;
  title: string;
  description: string | null;
  rewardPoints: number;
  isActive: boolean;
}

export interface UserMilestoneDTO {
  id: string;
  milestoneId: string;
  completed: boolean;
  claimed: boolean;
  completedAt: string | null;
  claimedAt: string | null;
  milestone: MilestoneDTO;
}

export interface MilestoneProgressDTO {
  milestones: UserMilestoneDTO[];
}

export function toMilestoneDTO(milestone: Milestone): MilestoneDTO {
  return {
    id: milestone.id,
    key: milestone.key,
    title: milestone.title,
    description: milestone.description,
    rewardPoints: milestone.rewardPoints,
    isActive: milestone.isActive,
  };
}

export function toUserMilestoneDTO(
  userMilestone: UserMilestone & { milestone: Milestone }
): UserMilestoneDTO {
  return {
    id: userMilestone.id,
    milestoneId: userMilestone.milestoneId,
    completed: userMilestone.completed,
    claimed: userMilestone.claimed,
    completedAt: userMilestone.completedAt?.toISOString() ?? null,
    claimedAt: userMilestone.claimedAt?.toISOString() ?? null,
    milestone: toMilestoneDTO(userMilestone.milestone),
  };
}
