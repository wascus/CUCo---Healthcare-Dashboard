import type { Placement, Status } from "../../../../../types/grief";

const PLACEMENT_COLOR: Record<Placement, string> = {
  base:   "#60a5fa",
  middle: "#a78bfa",
  summit: "#f97316",
};
const STATUS_COLOR: Record<Status, string> = {
  text: "#2563eb",
  check: "#16a34a",
  tear:  "#dc2626",
  image: "#f59e0b",
};
type PlacementLegendProps = {
  isMountain: boolean;
};

export function PlacementLegend({ isMountain }: PlacementLegendProps) {
  const items: { key: Placement; color: string; label: string }[] = isMountain
    ? [
        { key: "base", color: PLACEMENT_COLOR.base, label: "Base" },
        { key: "middle", color: PLACEMENT_COLOR.middle, label: "Middle" },
        { key: "summit", color: PLACEMENT_COLOR.summit, label: "Summit" },
      ]
    : [
        { key: "base", color: PLACEMENT_COLOR.base, label: "Surface" },
        { key: "middle", color: PLACEMENT_COLOR.middle, label: "Depths" },
        { key: "summit", color: PLACEMENT_COLOR.summit, label: "Bottom" },
      ];

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {items.map((i) => (
        <div key={i.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: i.color,
              display: "inline-block",
              border: "2px solid #e5e7eb",
            }}
          />
          <span style={{ fontSize: 12, color: "#374151" }}>{i.label}</span>
        </div>
      ))}
    </div>
  );
}
export function StatusLegend() {
  const items: { key: Status; color: string; label: string }[] = [
    { key: "text",  color: STATUS_COLOR.text,  label: "Text" },
    { key: "check", color: STATUS_COLOR.check, label: "Acknowledged" },
    { key: "tear",  color: STATUS_COLOR.tear,  label: "Too difficult" },
    { key: "image", color: STATUS_COLOR.image, label: "Image" },
  ];
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {items.map((i) => (
        <div key={i.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 999, background: "#fff", display: "inline-block", border: `2px solid ${i.color}` }} />
          <span style={{ fontSize: 12, color: "#374151" }}>{i.label}</span>
        </div>
      ))}
    </div>
  );
}
