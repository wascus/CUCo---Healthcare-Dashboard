import { useEffect, useState } from "react";
import { LocalFireDepartment, EmojiEvents, PushPin, Lightbulb, Bolt } from "@mui/icons-material";
import type { StreakDTO } from "../../../../services/streak";
import { getStreak, getAllStreaks } from "../../../../services/streak";
import "./Streaks.css";

export default function Streaks() {
  const [userStreak, setUserStreak] = useState<StreakDTO | null>(null);
  const [allStreaks, setAllStreaks] = useState<StreakDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStreaks = async () => {
      try {
        setLoading(true);
        const [myStreak, streaksList] = await Promise.all([
          getStreak(),
          getAllStreaks(),
        ]);
        setUserStreak(myStreak);
        setAllStreaks(streaksList);
        setError(null);
      } catch (err) {
        console.error("Error fetching streaks:", err);
        setError("Failed to load streak data");
      } finally {
        setLoading(false);
      }
    };

    fetchStreaks();
  }, []);

  if (loading) {
    return <div className="streaks-page loading">Loading streak data...</div>;
  }

  if (error) {
    return <div className="streaks-page error">{error}</div>;
  }

  const topStreaks = allStreaks
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 10);

  return (
    <div className="streaks-page">
      <h1><LocalFireDepartment sx={{ mr: 1, verticalAlign: "middle" }} /> Streaks</h1>

      {userStreak && (
        <div className="my-streak-section">
          <h2>Your Streak</h2>
          <div className="streak-display-card">
            <div className="streak-display-number">{userStreak.currentStreak}</div>
            <div className="streak-display-label">days</div>
            <div className="streak-display-multiplier">
              {userStreak.multiplier.toFixed(2)}x bonus
            </div>
            <div className="streak-display-info">
              <p>Personal Best: <strong>{userStreak.maxStreak} days</strong></p>
              {userStreak.lastActivityDate && (
                <p>Last Activity: <strong>{new Date(userStreak.lastActivityDate).toLocaleDateString()}</strong></p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="leaderboard-section">
        <h2><EmojiEvents sx={{ mr: 1, verticalAlign: "middle" }} /> Top Streaks</h2>
        {topStreaks.length > 0 ? (
          <div className="leaderboard-list">
            {topStreaks.map((streak, index) => (
              <div key={streak.id} className="leaderboard-item">
                <div className="rank-badge">
                  {index > 2 ? `#${index + 1}` : `#${index + 1}`}
                </div>
                <div className="streak-info">
                  <div className="streak-user-id">{streak.userId.slice(0, 8)}</div>
                  <div className="streak-bar-container">
                    <div 
                      className="streak-bar" 
                      style={{ 
                        width: `${Math.min((streak.currentStreak / Math.max(...topStreaks.map(s => s.currentStreak), 1)) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="streak-count">{streak.currentStreak} days</div>
              </div>
            ))}
          </div>
        ) : (
          <p>No streaks yet. Start your journey!</p>
        )}
      </div>

      <div className="milestones-guide-section">
        <h2><PushPin sx={{ mr: 1, verticalAlign: "middle" }} /> Milestone Guide</h2>
        <div className="milestones-grid">
          <div className="milestone-guide-card">
            <div className="milestone-number">7</div>
            <div className="milestone-label">Days</div>
            <div className="milestone-reward">+50 pts</div>
          </div>
          <div className="milestone-guide-card">
            <div className="milestone-number">14</div>
            <div className="milestone-label">Days</div>
            <div className="milestone-reward">+100 pts</div>
          </div>
          <div className="milestone-guide-card">
            <div className="milestone-number">30</div>
            <div className="milestone-label">Days</div>
            <div className="milestone-reward">+250 pts</div>
          </div>
        </div>
      </div>

      <div className="multipliers-guide-section">
        <h2><Bolt sx={{ mr: 1, verticalAlign: "middle" }} /> Bonus Multipliers</h2>
        <div className="multipliers-list">
          <div className="multiplier-row">
            <span className="range">Streak: 1</span>
            <span className="multiplier">1.00x</span>
          </div>
          <div className="multiplier-row">
            <span className="range">Streak: 2-4</span>
            <span className="multiplier">1.50x</span>
          </div>
          <div className="multiplier-row">
            <span className="range">Streak: 5-7</span>
            <span className="multiplier">2.00x</span>
          </div>
          <div className="multiplier-row">
            <span className="range">Streak: 8+</span>
            <span className="multiplier">3.00x</span>
          </div>
        </div>
      </div>

      <div className="tips-section">
        <h2><Lightbulb sx={{ mr: 1, verticalAlign: "middle" }} /> Tips</h2>
        <ul className="tips-list">
          <li>Use the platform every day to maintain your streak</li>
          <li>Streaks reset if you don't interact for 24+ hours</li>
          <li>Higher streaks give you better energy point multipliers</li>
          <li>Complete daily activities (diary, tasks, emotions) to grow your streak</li>
          <li>Reach milestones to earn bonus energy points</li>
        </ul>
      </div>
    </div>
  );
}
