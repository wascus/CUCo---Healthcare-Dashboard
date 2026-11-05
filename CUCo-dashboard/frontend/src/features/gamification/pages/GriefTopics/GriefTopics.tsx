import { useMemo, useState, useEffect } from "react";
import {
  useGriefTopicsCatalog,
  useUserTopics,
  useAddTopic,
  useAddCustomTopic,
  useUpdateTopicPlacement,
  useRemoveTopic,
  type Placement,
  type Status,
  type CatalogTopic,
} from "../../../../services/grief";
import { TOPIC_POINTS } from "../Gamification/constants";
import { getMultiplier } from "../../../../services/streak";
import { usePet } from "../../PetContext";
import TopicsCatalogList from "./TopicList/TopicsCatalogList";
import Valley from "./Mountain/Valley";
import TopicDetailDialog from "./TopicDetailDialog";

const DEFAULT_STATUS: Status = "text";

export default function GriefTopicsPage() {
  const { data: catalog = [], isLoading: catLoading, error: catErr } = useGriefTopicsCatalog();
  const {
    data: userTopics = [],
    isLoading: utLoading,
    error: utErr,
    refetch: refetchUserTopics,
  } = useUserTopics();

  const add = useAddTopic();
  const addCustom = useAddCustomTopic();
  const update = useUpdateTopicPlacement();
  const removeByRowId = useRemoveTopic();
  const { addEnergy } = usePet();

  // Merge catalog and custom user topics for the list
  const mergedCatalog = useMemo(() => {
    // Show custom topics as templates in the source list
    const customAsCatalog: CatalogTopic[] = userTopics
      .filter((t) => t.isCustom)
      .map((t) => ({
        id: `custom-template-${t.title}`,
        key: "custom",
        title: t.title,
        isCustom: true,
      }));
    
    // Deduplicate by title so we don't have multiple identical custom templates
    const uniqueCustom = Array.from(new Map(customAsCatalog.map(t => [t.title, t])).values());

    return [...catalog, ...uniqueCustom];
  }, [catalog, userTopics]);

  const existingTopicIds = useMemo(
    () => new Set(userTopics.map((t) => t.topicId).filter(id => id !== null)),
    [userTopics]
  );

  // dialog state
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [completionNotification, setCompletionNotification] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState(1.0);
  
  const activeTopic = useMemo(
    () => userTopics.find((t) => t.id === activeId) ?? null,
    [activeId, userTopics]
  );

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

  if (catLoading || utLoading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (catErr || utErr) return <div style={{ padding: 16, color: "crimson" }}>Failed to load topics.</div>;

  let activePrompt = "";
  if (activeTopic) {
    const cat = catalog.find((c: CatalogTopic) => c.id === activeTopic.topicId);
    activePrompt = (cat?.promptText ?? "") as string;
  }

  const handleAddTopic = (topicId: string, placement: Placement) => {
    if (topicId.startsWith("custom-template-")) {
      const title = topicId.replace("custom-template-", "");
      handleAddCustomTopic(title, placement);
      return;
    }
    add.mutate({ topicId, placement, status: DEFAULT_STATUS }, {
      onSuccess: () => {
        const earnedPoints = Math.floor(TOPIC_POINTS * multiplier);
        addEnergy(earnedPoints);
        setCompletionNotification(`+${earnedPoints} pts earned!`);
        setTimeout(() => setCompletionNotification(null), 3000);
      }
    });
  };

  const handleAddCustomTopic = (customTitle: string, placement: Placement) => {
    addCustom.mutate({ customTitle, placement, status: DEFAULT_STATUS }, {
      onSuccess: () => {
        const earnedPoints = Math.floor(TOPIC_POINTS * multiplier);
        addEnergy(earnedPoints);
        setCompletionNotification(`+${earnedPoints} pts earned!`);
        setTimeout(() => setCompletionNotification(null), 3000);
      }
    });
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(280px, 360px) 1fr",
        gap: 16,
        alignItems: "start",
        position: "relative"
      }}
    >
      {/* Completion Notification */}
      {completionNotification && (
        <div className="completion-notification" data-testid="completion-notification" style={{
          position: "fixed",
          top: "100px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          backgroundColor: "#4caf50",
          color: "white",
          padding: "12px 24px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontWeight: "bold",
          animation: "fadeInOut 3s forwards"
        }}>
          {completionNotification}
        </div>
      )}

      <TopicsCatalogList
        topics={mergedCatalog}
        existingTopicIds={existingTopicIds}
        hideExisting
        defaultPlacement={"base" as Placement}
        onAdd={handleAddTopic}
        onAddCustom={handleAddCustomTopic}
        enableDrag
      />

      <Valley
        topics={userTopics}
        onPlacementChange={(id, placement: Placement) => update.mutate({ id, placement })}
        onReturnToList={(id) => removeByRowId.mutate(id)}
        onAddFromCatalog={handleAddTopic}
        onOpenDetails={(id) => {
          setActiveId(id);
          setOpen(true);
        }}
      />

      <TopicDetailDialog
        open={open}
        topic={activeTopic}
        onClose={() => {
          setOpen(false);
          setActiveId(null);
        }}
        onChanged={() => refetchUserTopics()}
        placeholder={activePrompt}
      />
    </div>
  );
}
