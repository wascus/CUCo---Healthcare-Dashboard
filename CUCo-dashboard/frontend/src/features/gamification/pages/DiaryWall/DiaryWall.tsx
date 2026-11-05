// src/components/DiaryWall.tsx
import "./DiaryWall.css";
import { useState, useEffect, useMemo } from "react";
import {
  useDiaryNotes,
  useCreateDiaryNote,
  type NoteKind,
} from "../../../../services/diary";
import { JOURNAL_POINTS } from "../Gamification/constants";
import { usePet } from "../../PetContext";
import { getMultiplier } from "../../../../services/streak";

const formatDateKey = (date: Date) => date.toISOString().split("T")[0];

export default function DiaryWall() {
  // load notes via React Query
  const { data, isLoading } = useDiaryNotes({ limit: 50 });
  const notes = data?.items ?? [];

  // mutations
  const createNote = useCreateDiaryNote();

  // get multiplier from pet context
  const { addEnergy } = usePet();
  const [multiplier, setMultiplier] = useState(1.0);

  // modal + form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [shared, setShared] = useState(false);

  const [errors, setErrors] = useState({ title: "", content: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [completionNotification, setCompletionNotification] = useState<string | null>(null);
  
  // calendar selection
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const entriesByDate = useMemo(() => {
    const map = new Map<string, number>();
    const notesList = notes || [];
    notesList.forEach((note) => {
      const dateKey = formatDateKey(new Date(note.createdAt));
      map.set(dateKey, (map.get(dateKey) ?? 0) + 1);
    });
    return map;
  }, [notes]);

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

  const validate = () => {
    const next = { title: "", content: "" };
    let ok = true;
    if (!title.trim()) { next.title = "Please add a title for your entry"; ok = false; }
    else if (title.trim().length < 3) { next.title = "Title should be at least 3 characters"; ok = false; }

    if (!content.trim()) { next.content = "Please share your thoughts in the content area"; ok = false; }
    else if (content.trim().length < 10) { next.content = "Consider writing a bit more to help process your feelings"; ok = false; }

    setErrors(next);
    return ok;
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTitle("");
    setContent("");
    setShared(false);
    setErrors({ title: "", content: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorBanner(null);

    try {
      // small UX pause
      await new Promise((r) => setTimeout(r, 300));

      await createNote.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        kind: "EMOTIONAL",
        shared,
      });

      const earnedPoints = Math.floor(JOURNAL_POINTS * multiplier);
      addEnergy(earnedPoints);
      setCompletionNotification(`+${earnedPoints} pts earned!`);
      setTimeout(() => setCompletionNotification(null), 3000);

      closeModal();
    } catch (err) {
      console.error(err);
      setErrorBanner("We couldn't save your entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <header className="diary-header">
        <h2 className="diary-title">Your Grief Journal</h2>
        <p className="diary-description">
          This is your safe space to express thoughts, feelings, and memories.
          Writing can help you process your grief and find meaning in your journey.
        </p>
      </header>

      {errorBanner && <div className="error-banner">{errorBanner}</div>}

      {/* Completion Notification */}
      {completionNotification && (
        <div className="completion-notification" data-testid="completion-notification">
          {completionNotification}
        </div>
      )}

      {/* Action Button */}
      <div className="diary-actions">
        <button
          className="diary-add-button"
          onClick={() => setIsModalOpen(true)}
          data-testid="button-open-modal"
        >
          + Add Entry
        </button>
      </div>

      {/* Calendar and Entries */}
      <div className="diary-layout">
        <div className="calendar-section">
          <Calendar 
            entriesByDate={entriesByDate} 
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {selectedDate && notes.length > 0 && (
          <div className="entries-section">
            <EntriesDisplay selectedDate={selectedDate} notes={notes} />
          </div>
        )}
      </div>

      {/* Journal Info */}
      <div className="journal-info">
        <p>
          <strong>Earn Rewards:</strong> Each journal entry earns you {Math.floor(JOURNAL_POINTS * multiplier)} pts (base {JOURNAL_POINTS} × {multiplier.toFixed(2)}x multiplier)!
          These points help your companion grow happier and unlock new features.
        </p>
      </div>

      {/* Empty State */}
      {!isLoading && notes.length === 0 && (
        <div data-testid="empty-state" className="empty-state">
          <p className="empty-state-title">Your journal is waiting for your first entry</p>
          <p className="empty-state-subtitle">
            Click the "Add Entry" button to get started and begin your journaling journey.
          </p>
        </div>
      )}

      {/* Entry Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Entry</h2>
              <button
                className="modal-close"
                onClick={closeModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form" autoComplete="off">
              {/* Title */}
              <div className="form-group">
                <label htmlFor="entry-title" className="form-label">
                  How would you describe today's entry?
                </label>
                <input
                  id="entry-title"
                  data-testid="input-entry-title"
                  type="text"
                  autoComplete="off"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
                  }}
                  placeholder="e.g., Remembering Mom's smile, A difficult day..."
                  className={`form-input ${errors.title ? "error" : ""}`}
                />
                {errors.title && (
                  <div data-testid="error-title" className="error-message">
                    {errors.title}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="form-group">
                <label htmlFor="entry-content" className="form-label">
                  What's on your mind and heart today?
                </label>
                <textarea
                  id="entry-content"
                  data-testid="textarea-entry-content"
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (errors.content) setErrors((prev) => ({ ...prev, content: "" }));
                  }}
                  placeholder="Take your time to express what you're feeling..."
                  rows={5}
                  className={`form-textarea ${errors.content ? "error" : ""}`}
                />
                {errors.content && (
                  <div data-testid="error-content" className="error-message">
                    {errors.content}
                  </div>
                )}
              </div>

              {/* Shared toggle */}
              <div className="form-group inline">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={shared}
                    onChange={(e) => setShared(e.target.checked)}
                  />
                  Share with my circle
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  className="modal-button secondary"
                  disabled={isSubmitting || createNote.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="button-save-entry"
                  disabled={isSubmitting || createNote.isPending}
                  className="modal-button primary"
                >
                  {isSubmitting || createNote.isPending ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface EntriesDisplayProps {
  selectedDate: string;
  notes: Array<{
    id: string;
    title: string;
    content: string;
    kind: NoteKind;
    shared: boolean;
    createdAt: string;
  }>;
}

function EntriesDisplay({ selectedDate, notes }: EntriesDisplayProps) {
  const selectedNotes = notes.filter((note) => {
    const noteDate = formatDateKey(new Date(note.createdAt));
    return noteDate === selectedDate;
  });

  const prettyDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  if (selectedNotes.length === 0) {
    return (
      <div className="entries-empty">
        <p>No entries for {prettyDate(selectedDate)}</p>
      </div>
    );
  }

  return (
    <div className="entries-list">
      <h3 className="entries-title">
        Entries for {prettyDate(selectedDate)} ({selectedNotes.length})
      </h3>
      <div className="entries-scroll">
        {selectedNotes.map((entry) => (
          <article key={entry.id} className="entry-card">
            <header className="entry-header">
              <h4 className="entry-title">{entry.title}</h4>
            </header>
            {entry.shared && (
              <div className="entry-meta">
                <span className="entry-badge shared">🔗 Shared</span>
              </div>
            )}
            <div className="entry-content">{entry.content}</div>
          </article>
        ))}
      </div>
    </div>
  );
}

interface CalendarProps {
  entriesByDate: Map<string, number>;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

function Calendar({ entriesByDate, selectedDate, onSelectDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const days = [];
  const numDays = daysInMonth(currentDate);
  const startDay = firstDayOfMonth(currentDate);

  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= numDays; i++) {
    days.push(i);
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button className="calendar-nav" onClick={goToPreviousMonth} aria-label="Previous month">
          ‹
        </button>
        <h3 className="calendar-title">{monthName}</h3>
        <button className="calendar-nav" onClick={goToNextMonth} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="calendar-weekdays">
        <div className="weekday">Sun</div>
        <div className="weekday">Mon</div>
        <div className="weekday">Tue</div>
        <div className="weekday">Wed</div>
        <div className="weekday">Thu</div>
        <div className="weekday">Fri</div>
        <div className="weekday">Sat</div>
      </div>

      <div className="calendar-days">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="calendar-day empty" />;
          }

          const dateKey = formatDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
          const entryCount = entriesByDate.get(dateKey) ?? 0;
          const hasEntries = entryCount > 0;
          const isSelected = selectedDate === dateKey;

          return (
            <div
              key={day}
              className={`calendar-day ${hasEntries ? "has-entry" : ""} ${isSelected ? "selected" : ""}`}
              title={hasEntries ? `${entryCount} entry(ies)` : "No entries"}
              onClick={() => onSelectDate(isSelected ? null : dateKey)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectDate(isSelected ? null : dateKey);
                }
              }}
            >
              <span className="day-number">{day}</span>
              {hasEntries && <span className="day-indicator">•</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
