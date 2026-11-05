import { apiFetch } from './api';

export type MilestoneDTO = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  rewardPoints: number;
  isActive: boolean;
};

export type UserMilestoneDTO = {
  id: string;
  milestoneId: string;
  completed: boolean;
  claimed: boolean;
  completedAt: string | null;
  claimedAt: string | null;
  milestone: MilestoneDTO;
};

export type MilestoneProgressDTO = {
  milestones: UserMilestoneDTO[];
};

export type ClaimRewardResponse = {
  success: boolean;
  rewardPoints: number;
};

export async function getUserMilestones(): Promise<MilestoneProgressDTO> {
  return apiFetch<MilestoneProgressDTO>('/v1/milestones');
}

export async function claimMilestoneReward(
  milestoneId: string
): Promise<ClaimRewardResponse> {
  return apiFetch<ClaimRewardResponse>(`/v1/milestones/${milestoneId}/claim`, {
    method: 'POST',
  });
}

export async function checkAndUpdateMilestones(): Promise<MilestoneProgressDTO> {
  return apiFetch<MilestoneProgressDTO>('/v1/milestones/check', {
    method: 'POST',
  });
}

export async function markMilestoneComplete(
  milestoneKey: string
): Promise<UserMilestoneDTO | null> {
  return apiFetch<UserMilestoneDTO | null>(`/v1/milestones/${milestoneKey}/complete`, {
    method: 'POST',
  });
}
