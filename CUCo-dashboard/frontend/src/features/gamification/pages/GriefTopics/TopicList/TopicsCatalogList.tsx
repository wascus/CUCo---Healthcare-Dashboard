import { useMemo, useState } from "react";
import type { Placement, CatalogTopic } from "../../../../../services/grief";

type Props = {
  /** Full catalog list (from useGriefTopicsCatalog in the page). */
  topics: CatalogTopic[];
  /** Set of catalog topic ids already on the mountain (userTopics.map(t => t.topicId)). */
  existingTopicIds?: Set<string>;
  /** If true, hide topics already added; otherwise show them but disable "Add" and dim the card. */
  hideExisting?: boolean;
  /** Default placement to use when clicking the Add button (drag-and-drop uses drop target's placement). */
  defaultPlacement?: Placement;
  /** Click handler to add a topic directly (Catalog → Mountain). */
  onAdd?: (topicId: string, placement: Placement) => void;
  /** Click handler to add a custom topic. */
  onAddCustom?: (customTitle: string, placement: Placement) => void;
  /** If true, make list items draggable for DnD onto the Mountain. */
  enableDrag?: boolean;
};

const MIME_TOPIC_ID = "application/x-grief-topic-id";

export default function TopicsCatalogList({
  topics,
  existingTopicIds,
  hideExisting = true,
  defaultPlacement = "base",
  onAdd,
  onAddCustom,
  enableDrag = true,
}: Props) {
  const [query, setQuery] = useState("");
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? topics.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            (t.key?.toLowerCase().includes(q) ?? false) ||
            (t.promptText?.toLowerCase().includes(q) ?? false)
        )
      : topics;

    if (!existingTopicIds) return base;
    if (!hideExisting) return base;

    // Hide topics that are already on the mountain
    return base.filter((t) => !existingTopicIds.has(t.id));
  }, [topics, query, existingTopicIds, hideExisting]);

  const totalVisible = hideExisting && existingTopicIds
    ? topics.filter((t) => !existingTopicIds.has(t.id)).length
    : topics.length;

  function handleDragStart(e: React.DragEvent, topicId: string) {
    if (!enableDrag) return;
    // Signal to the Mountain what's being dragged
    e.dataTransfer.setData(MIME_TOPIC_ID, topicId);
    // Fallback for debugging / generic targets
    e.dataTransfer.setData("text/plain", topicId);
    e.dataTransfer.effectAllowed = "copy";
  }

  function handleCreateCustom() {
    const title = customInput.trim();
    if (!title) {
      setCustomError("Topic name is required");
      return;
    }
    setCustomError("");
    if (!onAddCustom) {
      setCustomError("Unable to create topic");
      return;
    }
    try {
      onAddCustom(title, defaultPlacement);
      setCustomInput("");
      setShowCustomDialog(false);
    } catch (err) {
      setCustomError(err instanceof Error ? err.message : "Failed to create topic");
    }
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ margin: 0 }}>Topics</h2>
          <small style={{ opacity: 0.7 }}>
            {filtered.length}/{totalVisible}
          </small>
        </div>
        <button
          onClick={() => setShowCustomDialog(true)}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#f0fdf4",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            color: "#16a34a",
          }}
          title="Create a custom topic"
        >
          + Custom
        </button>
      </div>

      <input
        type="search"
        autoComplete="off"
        placeholder="Search topics…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8 }}
        aria-label="Search topics"
      />

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {filtered.map((t) => {
          const isExisting = existingTopicIds?.has(t.id) ?? false;
          const disabled = isExisting && !hideExisting;

          return (
            <li
              key={t.id}
              draggable={enableDrag && !isExisting} // if we're hiding existing, it won't render anyway
              onDragStart={(e) => handleDragStart(e, t.id)}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 12,
                background: "#fff",
                opacity: disabled ? 0.5 : 1,
                cursor: enableDrag && !isExisting ? "grab" : "default",
              }}
              aria-disabled={disabled}
              aria-label={`Topic: ${t.title}`}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                  {t.key && <div style={{ fontSize: 12, opacity: 0.6 }}>key: {t.key}</div>}
                </div>

                <button
                  onClick={() => !isExisting && onAdd?.(t.id, defaultPlacement)}
                  disabled={isExisting}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: isExisting ? "#f3f4f6" : "#f9fafb",
                    cursor: isExisting ? "not-allowed" : "pointer",
                  }}
                  aria-disabled={isExisting}
                >
                  {isExisting ? "Added" : "Add"}
                </button>
              </div>

              {t.promptText && (
                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.8,
                    marginTop: 6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {t.promptText}
                </div>
              )}
            </li>
          );
        })}

        {filtered.length === 0 && (
          <li style={{ padding: 12, color: "#6b7280", fontStyle: "italic" }}>
            No topics match your search.
          </li>
        )}
      </ul>

      {showCustomDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setShowCustomDialog(false);
            setCustomError("");
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 12px 0" }}>Create Custom Topic</h3>
            <input
              type="text"
              autoComplete="off"
              placeholder="Enter topic name…"
              value={customInput}
              onChange={(e) => {
                setCustomInput(e.target.value);
                setCustomError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateCustom();
              }}
              autoFocus
              style={{
                width: "100%",
                padding: "10px 12px",
                border: customError ? "2px solid #dc2626" : "1px solid #e5e7eb",
                borderRadius: 8,
                marginBottom: 8,
                boxSizing: "border-box",
                fontSize: 14,
              }}
            />
            {customError && (
              <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 12 }}>
                {customError}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowCustomDialog(false);
                  setCustomError("");
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "#f3f4f6",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustom}
                disabled={!customInput.trim()}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: customInput.trim() ? "#16a34a" : "#d1d5db",
                  color: "#fff",
                  cursor: customInput.trim() ? "pointer" : "not-allowed",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Notes:
 * - Mountain should accept drops and read the ID via:
 *   const topicId = e.dataTransfer.getData("application/x-grief-topic-id");
 *   Then call useAddTopic().mutate({ topicId, placement: inferredPlacement })
 *
 * - If you prefer to keep showing existing topics (instead of hiding),
 *   pass hideExisting={false}. They will appear dimmed with the button disabled.
 */
