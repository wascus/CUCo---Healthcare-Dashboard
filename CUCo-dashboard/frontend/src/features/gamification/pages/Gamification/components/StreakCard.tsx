import { useEffect, useState } from "react";
import InfoIcon from "@mui/icons-material/Info";
import { LocalFireDepartment as FireIcon, Schedule as AlarmIcon, Lightbulb as LightbulbIcon } from "@mui/icons-material";
import type { StreakStats } from "../../../../../services/streak";
import { getStreakStats } from "../../../../../services/streak";

interface StreakCardProps {
  onStreakUpdate?: (stats: StreakStats) => void;
}

export default function StreakCard({ onStreakUpdate }: StreakCardProps) {
  const [stats, setStats] = useState<StreakStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<"below" | "above">("below");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const streakStats = await getStreakStats();
        setStats(streakStats);
        onStreakUpdate?.(streakStats);
      } catch (err) {
        console.error("Error fetching streak stats:", err);
        setError("Failed to load streak data");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [onStreakUpdate]);

  if (loading) {
    return (
      <div className="streak-card">
        <div className="streak-loading">Loading streak data...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="streak-card">
        <div className="streak-error">{error || "Unable to load streak"}</div>
      </div>
    );
  }

  const getStreakMilestoneMessage = (current: number): string => {
    if (current >= 30) return "Legendary Streak!";
    if (current >= 14) return "Amazing Streak!";
    if (current >= 7) return "Great Streak!";
    if (current > 0) return "Keep it up!";
    return "Start your streak!";
  };

  const getMultiplierColor = (multiplier: number): string => {
    if (multiplier >= 1.5) return "#FFD700";
    if (multiplier >= 1.25) return "#FF8C00";
    return "#FF6B6B";
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const tooltipHeight = 180;
    const offset = 12;
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    
    setTooltipPosition(spaceBelow < tooltipHeight + offset ? "above" : "below");
    setShowTooltip(true);
  };

  return (
    <div className="streak-card">
      <div className="streak-header">
        <div className="streak-title-container">
          <h3 className="streak-title"><FireIcon sx={{ mr: 0.5 }} /> Your Streak</h3>
          <div 
            className="info-icon-wrapper"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <button 
              className="info-icon-button" 
              aria-label="Learn how streaks work"
              type="button"
            >
              <InfoIcon sx={{ fontSize: "1.3rem" }} />
            </button>
            {showTooltip && (
              <div className={`streak-tooltip streak-tooltip-${tooltipPosition}`}>
                <h4>How Streaks Work</h4>
                <ul>
                  <li>Your streak increases every <strong>day</strong> you actively use the platform</li>
                  <li>Activities: diary entries, emotion tracking, grief topics, and tasks all count</li>
                  <li>If you miss <strong>1 day</strong> of activity, your streak resets to 1</li>
                  <li>Higher streaks unlock <strong>bonus multipliers</strong> for energy rewards</li>
                  <li><strong>Multiplier tiers:</strong> 1x (streak 1), 1.5x (2-4), 2x (5-7), 3x (8+)</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="streak-content">
        <div className="streak-main-display">
          <div className="streak-count-box">
            <div className="streak-count" data-testid="current-streak">
              {stats.currentStreak}
            </div>
            <div className="streak-count-label">days</div>
          </div>
          <div className="streak-message">
            {getStreakMilestoneMessage(stats.currentStreak)}
          </div>
        </div>

        <div className="streak-multiplier">
          <span className="multiplier-label">Bonus Multiplier</span>
          <div 
            className="multiplier-value"
            style={{ color: getMultiplierColor(stats.multiplier) }}
            data-testid="streak-multiplier"
          >
            {stats.multiplier.toFixed(2)}x
          </div>
        </div>

        <div className="streak-stats">
          <div className="stat-item">
            <span className="stat-label">Personal Best</span>
            <span className="stat-value" data-testid="max-streak">
              {stats.maxStreak} days
            </span>
          </div>
          {stats.lastActivityDate && (
            <div className="stat-item">
              <span className="stat-label">Last Activity</span>
              <span className="stat-value">
                {new Date(stats.lastActivityDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {stats.currentStreak > 0 && stats.daysUntilReset && (
          <div className="streak-reset-info">
            <span className="reset-icon"><AlarmIcon /></span>
            <span className="reset-text">
              {stats.daysUntilReset > 1 
                ? `Reset in ${stats.daysUntilReset} days` 
                : "Reset tomorrow if inactive"}
            </span>
          </div>
        )}

        <div className="streak-info">
          <p className="info-text">
            <LightbulbIcon sx={{ mr: 0.5, verticalAlign: "middle" }} /> <strong>Tip:</strong> Use the platform daily to maintain your streak and earn bonus energy points!
          </p>
        </div>
      </div>
    </div>
  );
}
