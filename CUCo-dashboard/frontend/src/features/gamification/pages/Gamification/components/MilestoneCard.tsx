import { useEffect, useState } from "react";
import { EmojiEvents as TargetIcon, CheckCircle as CheckCircleIcon, LockOpen as UnlockedIcon, Lock as LockedIcon, Star as StarIcon } from "@mui/icons-material";
import { getUserMilestones, claimMilestoneReward, checkAndUpdateMilestones, markMilestoneComplete } from "../../../../../services/milestones";
import type { MilestoneProgressDTO, UserMilestoneDTO } from "../../../../../services/milestones";
import { usePet } from "../../../PetContext";
import { useAuth } from "../../../../auth/AuthContext";
import { apiFetch } from "../../../../../services/api";

const DEFAULT_PET_NAME = "Fluffy";

function getStorageKey(key: string, userId: string | null): string {
  return userId ? `${key}:${userId}` : key;
}

export default function MilestoneCard() {
  const { user } = useAuth();
  const [data, setData] = useState<MilestoneProgressDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [diaryCount, setDiaryCount] = useState(0);
  const { addEnergy, petName, placedItems } = usePet();

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      await checkAndUpdateMilestones();
      const milestones = await getUserMilestones();
      setData(milestones);
      setError(null);
    } catch (err) {
      console.error("Error fetching milestones:", err);
      setError("Failed to load milestones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
    const interval = setInterval(fetchMilestones, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!data) return;

    const petNameChanged = petName !== DEFAULT_PET_NAME;
    const changePetNameMilestone = data.milestones.find(
      (m) => m.milestone.key === "change_pet_name"
    );

    if (petNameChanged && changePetNameMilestone && !changePetNameMilestone.completed) {
      const markedKey = getStorageKey("milestone-change-pet-name-marked", user.id);
      if (!localStorage.getItem(markedKey)) {
        localStorage.setItem(markedKey, "true");
        markMilestoneComplete("change_pet_name")
          .then(() => {
            setTimeout(() => fetchMilestones(), 100);
          })
          .catch((err) => console.error("Error marking milestone complete:", err));
      }
    }
  }, [petName, data, user]);

  useEffect(() => {
    if (!user) return;
    if (!data) return;

    const hasPlacedItem = placedItems && placedItems.length > 0;
    const placeFirstItemMilestone = data.milestones.find(
      (m) => m.milestone.key === "place_first_item"
    );

    if (hasPlacedItem && placeFirstItemMilestone && !placeFirstItemMilestone.completed) {
      const markedKey = getStorageKey("milestone-place-first-item-marked", user.id);
      if (!localStorage.getItem(markedKey)) {
        localStorage.setItem(markedKey, "true");
        markMilestoneComplete("place_first_item")
          .then(() => {
            setTimeout(() => fetchMilestones(), 100);
          })
          .catch((err) => console.error("Error marking milestone complete:", err));
      }
    }
  }, [placedItems, data, user]);

  useEffect(() => {
    (async () => {
      try {
        const diaryResponse = await apiFetch<{ items: any[] }>('/v1/diary-notes?limit=100');
        const entries = diaryResponse?.items ?? [];
        setDiaryCount(entries.length);
      } catch (error) {
        console.debug("Error fetching diary count:", error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!data) return;

    const has5JournalEntries = diaryCount >= 5;
    const write5JournalsMilestone = data.milestones.find(
      (m) => m.milestone.key === "write_5_journal_entries"
    );

    if (has5JournalEntries && write5JournalsMilestone && !write5JournalsMilestone.completed) {
      const markedKey = getStorageKey("milestone-write-5-journals-marked", user.id);
      if (!localStorage.getItem(markedKey)) {
        localStorage.setItem(markedKey, "true");
        markMilestoneComplete("write_5_journal_entries")
          .then(() => {
            setTimeout(() => fetchMilestones(), 100);
          })
          .catch((err) => console.error("Error marking milestone complete:", err));
      }
    }
  }, [diaryCount, data, user]);

  const handleClaimReward = async (milestone: UserMilestoneDTO) => {
    if (claimingId) return;
    if (!milestone.completed || milestone.claimed) return;

    try {
      setClaimingId(milestone.id);
      const result = await claimMilestoneReward(milestone.milestoneId);
      if (result.success) {
        addEnergy(result.rewardPoints);
        await fetchMilestones();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error claiming reward:", err);
      alert(`Failed to claim reward: ${errorMessage}`);
    } finally {
      setClaimingId(null);
    }
  };

  const getMilestoneIcon = (completed: boolean, claimed: boolean) => {
    if (claimed) return <CheckCircleIcon />;
    if (completed) return <UnlockedIcon />;
    return <LockedIcon />;
  };

  const getMilestoneStatus = (completed: boolean, claimed: boolean): string => {
    if (claimed) return "claimed";
    if (completed) return "unlocked";
    return "locked";
  };

  if (loading) {
    return (
      <div className="milestone-card">
        <div className="milestone-card-header">
          <h3 className="milestone-card-title"><TargetIcon sx={{ mr: 0.5 }} /> Milestones</h3>
        </div>
        <div className="milestone-loading">Loading milestones...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="milestone-card">
        <div className="milestone-card-header">
          <h3 className="milestone-card-title"><TargetIcon sx={{ mr: 0.5 }} /> Milestones</h3>
        </div>
        <div className="milestone-error">{error || "Unable to load milestones"}</div>
      </div>
    );
  }

  return (
    <div className="milestone-card">
      <div className="milestone-card-header">
        <h3 className="milestone-card-title"><TargetIcon sx={{ mr: 0.5 }} /> Milestones</h3>
      </div>

      {data.milestones.length === 0 ? (
        <div className="no-milestones">No milestones available yet</div>
      ) : (
        <div className="milestones-scroll-container">
          <div className="milestones-horizontal-list">
            {data.milestones.map((milestone) => {
              const status = getMilestoneStatus(milestone.completed, milestone.claimed);
              const icon = getMilestoneIcon(milestone.completed, milestone.claimed);
              const isClaimable = milestone.completed && !milestone.claimed;

              return (
                <div key={milestone.id} className={`milestone-horizontal-item milestone-${status}`}>
                  <div className="milestone-h-icon">
                    <span className="milestone-h-icon-content">{icon}</span>
                  </div>
                  
                  <div className="milestone-h-content">
                    <h4 className="milestone-h-title">{milestone.milestone.title}</h4>
                    {milestone.milestone.description && (
                      <p className="milestone-h-description">{milestone.milestone.description}</p>
                    )}
                    <div className="milestone-h-reward">
                      <span className="reward-icon"><StarIcon sx={{ fontSize: 16 }} /></span>
                      <span className="reward-points">{milestone.milestone.rewardPoints}</span>
                    </div>
                  </div>

                  {isClaimable && (
                    <button
                      className="claim-button-h"
                      onClick={() => handleClaimReward(milestone)}
                      disabled={claimingId === milestone.id}
                    >
                      {claimingId === milestone.id ? "..." : "Claim"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
