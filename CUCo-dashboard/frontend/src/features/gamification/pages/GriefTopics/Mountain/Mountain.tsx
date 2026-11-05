import { useEffect, useMemo, useRef, useState } from "react";
import type { Placement, Status, Topic } from "../../../../../types/grief";
import { PlacementLegend, StatusLegend } from "./Legends";

/* ====== DnD MIME to match TopicsCatalogList ====== */
const MIME_TOPIC_ID = "application/x-grief-topic-id";

/* ====== constants ====== */
const WIDTH = 1000;
const HEIGHT = 520;
const PEAK_Y = HEIGHT * 0.1;
const BASE_Y = HEIGHT * 0.9;
const CX = WIDTH / 2;

const BASE_WIDTH = WIDTH * 0.88;
const PEAK_WIDTH = WIDTH * 0.06;
const SHAPE = 1.8;

const RADIUS = 10;
const PAD_X = 14;
const PAD_Y = 6;

const STATUS_COLOR: Record<Status, string> = {
  text: "#2563eb",
  check: "#16a34a",
  tear:  "#dc2626",
  image: "#f59e0b",
};
const STATUS_LABEL: Record<Status, string> = {
  text: "Text",
  check: "Acknowledged",
  tear:  "Too difficult",
  image: "Image",
};
const PLACEMENT_COLOR: Record<Placement, string> = {
  base:   "#60a5fa",
  middle: "#a78bfa",
  summit: "#f97316",
};
const LAYER_FILL = { base: "#f9fafb", middle: "#f3f4f6", summit: "#eef2ff" };
const LAYER_Y: Record<Placement, [number, number]> = {
  base:   [0.66, 0.9],
  middle: [0.40, 0.66],
  summit: [0.16, 0.40],
};

/* ====== helpers ====== */
function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }
function widthAtY(y: number) {
  const t = clamp((BASE_Y - y) / (BASE_Y - PEAK_Y), 0, 1);
  return PEAK_WIDTH + (BASE_WIDTH - PEAK_WIDTH) * Math.pow(1 - t, SHAPE);
}
function xRangeAtY(y: number) {
  const half = widthAtY(y) / 2;
  return [CX - half + PAD_X, CX + half - PAD_X] as const;
}
function yForLayer(layer: Placement, k: number) {
  const [y0f, y1f] = LAYER_Y[layer];
  const y0 = HEIGHT * y0f + PAD_Y;
  const y1 = HEIGHT * y1f - PAD_Y;
  return y0 + (y1 - y0) * k;
}
function seed01(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 0xffffffff;
}
function layerFromY(y: number): Placement {
  const f = y / HEIGHT;
  if (f <= LAYER_Y.summit[1]) return "summit";
  if (f <= LAYER_Y.middle[1]) return "middle";
  return "base";
}
function layoutForTopic(t: Topic) {
  const ky = seed01(`${t.id}:${t.placement}`);
  const kx = seed01(`${t.title}:${t.placement}`);
  const y = yForLayer(t.placement, ky);
  const [xL, xR] = xRangeAtY(y);
  const x = xL + (xR - xL) * kx;
  return { x, y };
}
function computeBasePositions(topics: Topic[]) {
  const pos: Record<string, { x: number; y: number }> = {};
  topics.forEach((t) => (pos[t.id] = layoutForTopic(t)));
  return pos;
}
function safeDateShort(s?: string | null) {
  if (!s) return "No date";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "No date" : d.toLocaleDateString();
}
/* ====== tooltip ====== */
const TT_PAD_X = 10, TT_PAD_Y = 8, TT_LINE = 16;
function approxTextWidth(s: string) { return Math.max(8, Math.min(36, Math.round(s.length))) * 7; }
function tooltipBox(lines: string[]) {
  const w = clamp(Math.max(...lines.map(approxTextWidth)) + TT_PAD_X * 2, 140, 320);
  const h = TT_PAD_Y * 2 + lines.length * TT_LINE;
  return { w, h };
}

function SvgTooltip({ x, y, lines }: { x: number; y: number; lines: string[] }) {
  const { w, h } = tooltipBox(lines);
  const margin = 8, arrow = 8;

  let tx = clamp(x - w / 2, margin, WIDTH - w - margin);
  let ty = clamp(y - h - 14, margin, HEIGHT - h - margin);
  const arrowX = x - tx, arrowY = h;
  const arrowPath = `M ${arrowX - arrow},${arrowY} L ${arrowX + arrow},${arrowY} L ${arrowX},${arrowY + arrow} Z`;

  return (
    <g transform={`translate(${tx}, ${ty})`} pointerEvents="none">
      <rect x={0} y={0} rx={8} ry={8} width={w} height={h} fill="#111827" opacity={0.95} />
      <path d={arrowPath} fill="#111827" opacity={0.95} />
      {lines.map((line, i) => (
        <text key={i} x={TT_PAD_X} y={TT_PAD_Y + (i + 0.9) * TT_LINE} fill="#ffffff" fontSize={12}>
          {line}
        </text>
      ))}
    </g>
  );
}

/* ====== small pieces ====== */
function LayerLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return <text x={x} y={y} fontSize={14} fill="#6b7280" fontWeight={600}>{text}</text>;
}
function bandPolygon(y0f: number, y1f: number) {
  const pts: string[] = [];
  const y0 = HEIGHT * y0f, y1 = HEIGHT * y1f, steps = 24;
  for (let i = 0; i <= steps; i++) {
    const y = y0 + (y1 - y0) * (i / steps);
    const [xL] = xRangeAtY(y);
    pts.push(`${xL},${y}`);
  }
  for (let i = steps; i >= 0; i--) {
    const y = y0 + (y1 - y0) * (i / steps);
    const [, xR] = xRangeAtY(y);
    pts.push(`${xR},${y}`);
  }
  return pts.join(" ");
}
function outlinePath() {
  const steps = 80, parts: string[] = [];
  const left: [number, number][] = [], right: [number, number][] = [];
  for (let i = steps; i >= 0; i--) {
    const y = BASE_Y - (BASE_Y - PEAK_Y) * (i / steps);
    const [xL] = xRangeAtY(y);
    left.push([xL, y]);
  }
  for (let i = 0; i <= steps; i++) {
    const y = BASE_Y - (BASE_Y - PEAK_Y) * (i / steps);
    const [, xR] = xRangeAtY(y);
    right.push([xR, y]);
  }
  parts.push(`M ${left[0][0]},${left[0][1]}`);
  left.slice(1).forEach(([x, y]) => parts.push(`L ${x},${y}`));
  right.forEach(([x, y]) => parts.push(`L ${x},${y}`));
  parts.push("Z");
  return parts.join(" ");
}

/* ====== props ====== */
export type MountainProps = {
  topics: Topic[]; 
  onPlacementChange: (id: string, placement: Placement) => void;
  /** When dot is released clearly outside the mountain, treat as "return to list". */
  onReturnToList?: (id: string) => void;
  /** Optional: when a catalog item is dropped on the mountain. */
  onAddFromCatalog?: (topicId: string, placement: Placement) => void;
  onOpenDetails?: (id: string) => void;

};

export default function Mountain({ topics, onPlacementChange, onReturnToList, onAddFromCatalog,onOpenDetails }: MountainProps) {
  const basePositions = useMemo(() => computeBasePositions(topics), [topics]);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() => basePositions);
  const [hoverId, setHoverId] = useState<string | null>(null);

  // External-drag hint state
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<{ x: number; y: number; placement: Placement } | null>(null);

  useEffect(() => {
    setPositions((prev) => {
      let changed = false;
      const next: Record<string, { x: number; y: number }> = {};
      for (const t of topics) {
        const cur = prev[t.id];
        const base = basePositions[t.id];
        const chosen = cur ?? base;
        next[t.id] = chosen;
        if (!cur || cur.x !== chosen.x || cur.y !== chosen.y) changed = true;
      }
      if (Object.keys(prev).length !== Object.keys(next).length) changed = true;
      return changed ? next : prev;
    });
  }, [topics, basePositions]);

  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  /* ====== coordinate helpers ====== */
  function clientToSvg(clientX: number, clientY: number) {
    const svg = svgRef.current; if (!svg) return null;
    const pt = svg.createSVGPoint(); pt.x = clientX; pt.y = clientY;
    const ctm = svg.getScreenCTM(); if (!ctm) return null;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  /* ====== internal dot drag (reposition) ====== */
  function onPointerDown(e: React.PointerEvent<SVGCircleElement>, id: string) {
    setHoverId(null);
    const svg = svgRef.current; if (!svg) return;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM(); if (!ctm) return;
    const p = pt.matrixTransform(ctm.inverse());
    const current = positions[id] ?? basePositions[id];
    dragRef.current = { id, dx: current.x - p.x, dy: current.y - p.y };
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const d = dragRef.current; if (!d) return;
    const svg = svgRef.current; if (!svg) return;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM(); if (!ctm) return;
    const p = pt.matrixTransform(ctm.inverse());

    let y = clamp(p.y + d.dy, PEAK_Y + PAD_Y, BASE_Y - PAD_Y);
    const [xL, xR] = xRangeAtY(y);
    let x = clamp(p.x + d.dx, xL, xR);
    setPositions((prev) => ({ ...prev, [d.id]: { x, y } }));
  }

  function onPointerUp() {
    const d = dragRef.current; if (!d) return;
    dragRef.current = null;
    const pos = positions[d.id] ?? basePositions[d.id];
    const [xL, xR] = xRangeAtY(pos.y);
    const margin = 12;
    const outside =
      pos.y < PEAK_Y - margin ||
      pos.y > BASE_Y + margin ||
      pos.x < xL - margin ||
      pos.x > xR + margin;

    if (outside && onReturnToList) {
      onReturnToList(d.id);
      return;
    }

    const newPlacement = layerFromY(pos.y);
    onPlacementChange(d.id, newPlacement);
  }

  /* ====== external DnD: accept catalog topics ====== */
  function handleDragOver(e: React.DragEvent<SVGSVGElement>) {
    const hasTopic = !!e.dataTransfer.types?.includes(MIME_TOPIC_ID) || !!e.dataTransfer.types?.includes("text/plain");
    if (!hasTopic) return;

    e.preventDefault(); // allow drop
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);

    const p = clientToSvg(e.clientX, e.clientY);
    if (!p) return;

    const y = clamp(p.y, PEAK_Y + PAD_Y, BASE_Y - PAD_Y);
    const [xL, xR] = xRangeAtY(y);
    const x = clamp(p.x, xL, xR);
    setPreview({ x, y, placement: layerFromY(y) });
  }

  function handleDragLeave() {
    setIsDragOver(false);
    setPreview(null);
  }

  function handleDrop(e: React.DragEvent<SVGSVGElement>) {
    const topicId =
      e.dataTransfer.getData(MIME_TOPIC_ID) ||
      e.dataTransfer.getData("text/plain");
    setIsDragOver(false);
    setPreview(null);
    if (!topicId) return;

    const p = clientToSvg(e.clientX, e.clientY);
    if (!p) return;

    const y = clamp(p.y, PEAK_Y + PAD_Y, BASE_Y - PAD_Y);
    const placement = layerFromY(y);

    onAddFromCatalog?.(topicId, placement);
  }

  /* ====== dbl-click & keyboard delete for a11y ====== */
  function handleDotKeyDown(e: React.KeyboardEvent<SVGGElement>, id: string) {
    if ((e.key === "Delete" || e.key === "Backspace") && onReturnToList) {
      e.preventDefault();
      onReturnToList(id);
    }
  }
  function handleDotDoubleClick(id: string) {
    onReturnToList?.(id);
  }

  const hovered = hoverId ? topics.find(t => t.id === hoverId) ?? null : null;
  const hoverPos = hovered ? (positions[hovered.id] ?? basePositions[hovered.id]) : null;
  const hoverPlacement = hoverPos ? layerFromY(hoverPos.y) : null;

  /* ====== render ====== */
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, background: "#fff" }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center", padding: 12, flexWrap: "wrap" }}>
        <PlacementLegend isMountain={true}/>
        <StatusLegend />
        <small style={{ opacity: 0.75 }}>Fill = placement • Outline = status</small>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ touchAction: "none" }}
      >
        {/* bands */}
        <polygon points={bandPolygon(...LAYER_Y.summit)} fill={LAYER_FILL.summit} opacity={isDragOver ? 0.95 : 1} />
        <polygon points={bandPolygon(...LAYER_Y.middle)} fill={LAYER_FILL.middle} opacity={isDragOver ? 0.95 : 1} />
        <polygon points={bandPolygon(...LAYER_Y.base)} fill={LAYER_FILL.base} opacity={isDragOver ? 0.95 : 1} />

        {/* outline & ground */}
        <path d={outlinePath()} fill="none" stroke="#e5e7eb" strokeWidth={2} />
        <line x1="0" y1={BASE_Y} x2={WIDTH} y2={BASE_Y} stroke="#e5e7eb" />

        {/* labels */}
        <LayerLabel x={80} y={HEIGHT * 0.20} text="Summit" />
        <LayerLabel x={80} y={HEIGHT * 0.46} text="Middle" />
        <LayerLabel x={80} y={HEIGHT * 0.76} text="Base" />

        {/* existing dots */}
        {topics.map((t) => {
          const p = positions[t.id] ?? basePositions[t.id];
          const placementNow = layerFromY(p.y);
          return (
            <g
              key={t.id}
              transform={`translate(${p.x}, ${p.y})`}
              style={{ cursor: "grab" }}
              onPointerEnter={() => !dragRef.current && setHoverId(t.id)}
              onPointerLeave={() => setHoverId((id) => (id === t.id ? null : id))}
              onKeyDown={(e) => handleDotKeyDown(e, t.id)}
              onDoubleClick={() => handleDotDoubleClick(t.id)}
              onClick={()=> {if(!dragRef.current) onOpenDetails?.(t.id);}}
              tabIndex={0}                       // focusable for keyboard delete
              role="button"
              aria-label={`Topic ${t.title}. Press Delete to remove.`}
            >
              <circle
                r={RADIUS}
                fill={PLACEMENT_COLOR[placementNow]}
                stroke={STATUS_COLOR[t.status]}
                strokeWidth={2}
                onPointerDown={(e) => onPointerDown(e, t.id)}
              />
              <title>{t.title}</title>
            </g>
          );
        })}

        {/* preview while dragging from catalog */}
        {isDragOver && preview && (
          <g transform={`translate(${preview.x}, ${preview.y})`} pointerEvents="none">
            <circle r={RADIUS} fill={PLACEMENT_COLOR[preview.placement]} stroke="#111827" strokeDasharray="2 2" strokeWidth={2} opacity={0.7} />
          </g>
        )}

        {/* tooltip */}
        {hovered && hoverPos && hoverPlacement && !dragRef.current && (
          <SvgTooltip
            x={hoverPos.x}
            y={hoverPos.y}
            lines={[
              hovered.title,
              `Placement: ${hoverPlacement}`,
              `Status: ${STATUS_LABEL[hovered.status]}`,
              `Created: ${safeDateShort((hovered as any).createdAt)}`,
              `Updated: ${safeDateShort((hovered as any).updatedAt)}`,
            ]}
          />
        )}
      </svg>
    </div>
  );
}
