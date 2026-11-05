import "./TestsOverview.css";
import { useMemo, useState, useEffect } from "react";
import EmotionCharts from "./EmotionCharts";
import {
  useEmotions,
  useCreateEmotion,
  type EmotionName,
  type EmotionEntryDTO,
} from "../../../../services/testsOverview";
import { EMOTION_POINTS } from "../Gamification/constants";
import { getMultiplier } from "../../../../services/streak";
import { usePet } from "../../PetContext";

/** ---------------- Types used by this component ---------------- */
interface EmotionEntry extends EmotionEntryDTO {
  date: string; // pretty display date derived from createdAt
}

/** ---------------- Icons ---------------- */
const getEmotionIcon = (emotionName: string, size = 16) => {
  const iconProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (emotionName) {
    case "Joy":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      );
    case "Sadness":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      );
    case "Anger":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <path d="M7.5 8L10 10.5" />
          <path d="M16.5 8L14 10.5" />
        </svg>
      );
    case "Fear":
      return (
        <svg {...iconProps}>
          <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 5.16-1 9-5.45 9-11V7l-10-5z" />
          <circle cx="12" cy="11" r="2" />
        </svg>
      );
    case "Hope":
      return (
        <svg {...iconProps}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      );
    case "Love":
      return (
        <svg {...iconProps}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case "Guilt":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
        </svg>
      );
    case "Acceptance":
      return (
        <svg {...iconProps}>
          <polyline points="20,6 9,17 4,12" />
        </svg>
      );
    case "Confusion":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "Gratitude":
      return (
        <svg {...iconProps}>
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      );
    default:
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
};

/** ---------------- Predefined emotions ---------------- */
const EMOTION_TYPES: { name: EmotionName; color: string }[] = [
  { name: "Joy", color: "#fbbf24" },
  { name: "Sadness", color: "#3b82f6" },
  { name: "Anger", color: "#ef4444" },
  { name: "Fear", color: "#6b7280" },
  { name: "Hope", color: "#10b981" },
  { name: "Love", color: "#ec4899" },
  { name: "Guilt", color: "#8b5cf6" },
  { name: "Acceptance", color: "#06b6d4" },
  { name: "Confusion", color: "#f59e0b" },
  { name: "Gratitude", color: "#84cc16" },
];

/** ---------------- Utils ---------------- */
const getBubbleSize = (intensity: number) => 20 + (intensity - 1) * 7; // 20px to 83px
const prettyDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function TestsOverview() {
  // form state
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionName | "">("");
  const [intensity, setIntensity] = useState<number>(5);
  const [note, setNote] = useState<string>("");
  const [completionNotification, setCompletionNotification] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState(1.0);

  // queries & mutations (React Query + session-aware service)
  const { data, isLoading, error } = useEmotions({ limit: 50 });
  const createMutation = useCreateEmotion();
  const { addEnergy } = usePet();

  // Fetch multiplier on mount
  useEffect(() => {
    const fetchMultiplier = async () => {
      try {
        const response = await getMultiplier();
        setMultiplier(response.multiplier);
      } catch (error) {
        console.error('Error fetching multiplier:', error);
        setMultiplier(1.0);
      }
    };
    fetchMultiplier();
  }, []);

  // map DTOs -> VM with pretty date
  const emotions: EmotionEntry[] = useMemo(
    () =>
      (data?.items ?? []).map((e) => ({
        ...e,
        date: prettyDate(e.createdAt),
      })),
    [data?.items]
  );

  // group for timeline
  const emotionsByDate = useMemo(() => {
    return emotions.reduce((acc, emotion) => {
      const dateKey = new Date(emotion.createdAt).toLocaleDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(emotion);
      return acc;
    }, {} as Record<string, EmotionEntry[]>);
  }, [emotions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmotion) return;

    // brief delay to preserve your original UX feel
    await new Promise((r) => setTimeout(r, 300));

    const emotionType = EMOTION_TYPES.find((x) => x.name === selectedEmotion);
    if (!emotionType) return;

    await createMutation.mutateAsync({
      emotion: selectedEmotion,
      color: emotionType.color,
      intensity,
      note: note.trim() ? note.trim() : null,
    });

    const earnedPoints = Math.floor(EMOTION_POINTS * multiplier);
    addEnergy(earnedPoints);
    setCompletionNotification(`+${earnedPoints} pts earned!`);
    setTimeout(() => setCompletionNotification(null), 3000);

    // reset form (query will refetch via invalidate on success)
    setSelectedEmotion("");
    setIntensity(5);
    setNote("");
  };

  const submitDisabled = !selectedEmotion || createMutation.isPending;

  return (
    <div className="app-container">
      <header className="tests-header">
        <h2 className="tests-title">Emotion Bubbles</h2>
        <p className="tests-description">
          Track your daily emotions as colored bubbles. The size reflects how intensely you're feeling each emotion,
          creating a visual map of your grief journey.
        </p>
      </header>

      {/* Completion Notification */}
      {completionNotification && (
        <div className="completion-notification" data-testid="completion-notification">
          {completionNotification}
        </div>
      )}

      {(error || createMutation.error) && (
        <div role="alert" className="error-banner">
          {(error as any)?.message || (createMutation.error as any)?.message || "Something went wrong"}
        </div>
      )}

      {/* Emotion Entry Form */}
      <form onSubmit={handleSubmit} className="emotion-form" autoComplete="off">
        <h3 className="emotion-form-title">How are you feeling right now?</h3>

        {/* Emotion Selection */}
        <div className="emotion-form-group">
          <label className="emotion-form-label">Choose an emotion</label>
          <div className="emotion-grid">
            {EMOTION_TYPES.map((emotionType) => (
              <button
                key={emotionType.name}
                type="button"
                data-testid={`emotion-${emotionType.name.toLowerCase()}`}
                onClick={() => setSelectedEmotion(emotionType.name)}
                className={`emotion-button ${selectedEmotion === emotionType.name ? "selected" : ""}`}
                style={{
                  borderColor: selectedEmotion === emotionType.name ? emotionType.color : undefined,
                  backgroundColor: selectedEmotion === emotionType.name ? emotionType.color + "20" : undefined,
                }}
              >
                <span className="emotion-icon" style={{ color: emotionType.color }}>
                  {getEmotionIcon(emotionType.name, 18)}
                </span>
                {emotionType.name}
              </button>
            ))}
          </div>
        </div>

        {/* Intensity Slider */}
        <div className="emotion-form-group">
          <label className="emotion-form-label">Intensity level: {intensity}/10</label>
          <div className="intensity-container">
            <span className="intensity-label-text">Mild</span>
            <input
              type="range"
              data-testid="intensity-slider"
              min="1"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="intensity-slider"
              style={{
                background: `linear-gradient(to right, #e5e7eb 0%, ${
                  selectedEmotion
                    ? EMOTION_TYPES.find((e) => e.name === selectedEmotion)?.color || "#e5e7eb"
                    : "#e5e7eb"
                } 100%)`,
              }}
            />
            <span className="intensity-label-text">Intense</span>
          </div>
          {/* Preview bubble */}
          {selectedEmotion && (
            <div className="preview-container">
              <span className="preview-label">Preview:</span>
              <div
                className="preview-bubble"
                style={{
                  width: `${getBubbleSize(intensity)}px`,
                  height: `${getBubbleSize(intensity)}px`,
                  backgroundColor: EMOTION_TYPES.find((e) => e.name === selectedEmotion)?.color,
                }}
              >
                {getEmotionIcon(selectedEmotion, Math.max(12, getBubbleSize(intensity) * 0.4))}
              </div>
            </div>
          )}
        </div>

        {/* Optional Note */}
        <div className="emotion-form-group">
          <label htmlFor="emotion-note" className="emotion-form-label">
            Note (optional)
          </label>
          <input
            id="emotion-note"
            data-testid="input-emotion-note"
            type="text"
            autoComplete="off"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What triggered this feeling? Any additional context..."
            className="emotion-note-input"
          />
        </div>

        <button
          type="submit"
          data-testid="button-save-emotion"
          disabled={submitDisabled}
          className="emotion-submit-button"
        >
          {createMutation.isPending ? "Saving..." : "Add Emotion"}
        </button>
      </form>

      {/* Visualizations */}
      {!isLoading && emotions.length > 0 && <EmotionCharts emotions={data?.items || []} />}

      {/* Emotion History Display */}
      {isLoading ? (
        <div data-testid="empty-emotion-state" className="empty-emotion-state">
          <p className="empty-emotion-title">Loading your emotions…</p>
        </div>
      ) : (emotions.length === 0) ? (
        <div data-testid="empty-emotion-state" className="empty-emotion-state">
          <p className="empty-emotion-title">Start tracking your emotions</p>
          <p className="empty-emotion-subtitle">
            Your emotion bubbles will appear here, creating a visual history of your feelings.
          </p>
        </div>
      ) : (
        <div data-testid="emotion-history">
          <h3 className="emotion-history-title">Your Emotion History ({emotions.length} entries)</h3>

          {/* Recent Emotions Overview */}
          <div className="recent-emotions-container">
            <h4 className="recent-emotions-title">Recent Emotions</h4>
            <div className="recent-emotions-bubbles">
              {emotions.slice(0, 10).map((emotion) => (
                <div
                  key={emotion.id}
                  data-testid={`bubble-${emotion.id}`}
                  title={`${emotion.emotion} (${emotion.intensity}/10) - ${emotion.date}`}
                  className="emotion-bubble"
                  style={{
                    width: `${getBubbleSize(emotion.intensity)}px`,
                    height: `${getBubbleSize(emotion.intensity)}px`,
                    backgroundColor: emotion.color,
                  }}
                >
                  {getEmotionIcon(emotion.emotion, Math.max(10, getBubbleSize(emotion.intensity) * 0.4))}
                </div>
              ))}
            </div>
          </div>

          {/* Daily Timeline */}
          {Object.entries(emotionsByDate)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .slice(0, 7) // Show last 7 days
            .map(([date, dayEmotions]) => (
              <div key={date} data-testid={`emotion-day-${date}`} className="timeline-day">
                <h4 className="timeline-day-title">{date}</h4>
                <div className="timeline-day-emotions">
                  {dayEmotions.map((emotion) => (
                    <div key={emotion.id} data-testid={`timeline-emotion-${emotion.id}`} className="timeline-emotion-item">
                      <div
                        data-testid={`timeline-bubble-${emotion.id}`}
                        title={`${emotion.emotion} (${emotion.intensity}/10)${emotion.note ? ` - ${emotion.note}` : ""}`}
                        className="timeline-bubble"
                        style={{
                          width: `${getBubbleSize(emotion.intensity)}px`,
                          height: `${getBubbleSize(emotion.intensity)}px`,
                          backgroundColor: emotion.color,
                        }}
                      >
                        {getEmotionIcon(emotion.emotion, Math.max(10, getBubbleSize(emotion.intensity) * 0.4))}
                      </div>
                      <div className="timeline-emotion-details">
                        <div data-testid={`emotion-name-${emotion.id}`} className="timeline-emotion-name">
                          {emotion.emotion}
                        </div>
                        <div data-testid={`emotion-timestamp-${emotion.id}`} className="timeline-emotion-timestamp">
                          {emotion.date}
                        </div>
                        {emotion.note && (
                          <div data-testid={`emotion-note-${emotion.id}`} className="timeline-emotion-note">
                            {emotion.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
