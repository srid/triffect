import {
  type Component,
  createSignal,
  For,
  Show,
  Switch,
  Match,
} from "solid-js";
import { useQuery } from "@triplit/solid";
import { client } from "../lib/triplit";
import { barycentricToColor, type Barycentric } from "../lib/coords";
import MoodDot from "./MoodDot";

// ── Data helpers ──

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

interface Entry {
  good: number;
  bad: number;
  naivete: number;
  created_at: Date | string;
}

function entryColor(e: Entry): string {
  return barycentricToColor({ good: e.good, bad: e.bad, naivete: e.naivete });
}

function entryTime(e: Entry): string {
  return new Date(e.created_at).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function byTime(a: Entry, b: Entry): number {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

/** Fraction of the 24h day elapsed at the given time. */
function dayFraction(date: Date): number {
  return (date.getHours() + date.getMinutes() / 60) / 24;
}

// ── Placed item (shared by timeline & arcs layouts) ──

interface Placed {
  color: string;
  time: string;
}

// ── View mode persistence ──

type ViewMode = "timeline" | "dots" | "arcs";
const VIEW_MODES: ViewMode[] = ["timeline", "dots", "arcs"];
const VIEW_ICONS: Record<ViewMode, string> = {
  timeline: "―",
  dots: "••",
  arcs: "⌒",
};

function loadViewMode(): ViewMode {
  const stored = localStorage.getItem("triffect-view-mode");
  return VIEW_MODES.includes(stored as ViewMode)
    ? (stored as ViewMode)
    : "timeline";
}

// ── View 1: Horizontal Timeline ──

const TL_W = 240;
const TL_PAD = 20;
const TL_TRACK = TL_W - TL_PAD * 2;
const DOT_R = 5;
const DOT_SPACING = DOT_R * 2 + 1;

interface TimelineDot extends Placed {
  cx: number;
  cy: number;
}

function layoutTimeline(entries: Entry[]): TimelineDot[] {
  const sorted = [...entries].sort(byTime);
  const placed: TimelineDot[] = [];
  const baseY = 14;

  for (const entry of sorted) {
    const x = TL_PAD + dayFraction(new Date(entry.created_at)) * TL_TRACK;
    let y = baseY;
    while (placed.some((p) => Math.hypot(p.cx - x, p.cy - y) < DOT_SPACING)) {
      y -= DOT_SPACING;
    }
    placed.push({
      cx: x,
      cy: y,
      color: entryColor(entry),
      time: entryTime(entry),
    });
  }
  return placed;
}

const TIME_LABELS = [
  { hour: 0, label: "12a" },
  { hour: 6, label: "6a" },
  { hour: 12, label: "12p" },
  { hour: 18, label: "6p" },
  { hour: 24, label: "12a" },
];

const TimelineView: Component<{
  entries: Entry[];
  onHover: (t: string | null) => void;
}> = (props) => {
  const dots = () => layoutTimeline(props.entries);
  const baseY = 14;
  const svgH = () => {
    const ds = dots();
    if (ds.length === 0) return 32;
    const minY = Math.min(...ds.map((d) => d.cy));
    return Math.max(32, baseY - minY + DOT_R + 8);
  };
  const lineY = () => svgH() - (32 - baseY);

  return (
    <svg
      width={TL_W}
      height={svgH()}
      viewBox={`0 0 ${TL_W} ${svgH()}`}
      class="max-w-[240px]"
    >
      <line
        x1={TL_PAD}
        y1={lineY()}
        x2={TL_W - TL_PAD}
        y2={lineY()}
        stroke="rgba(255,255,255,0.1)"
        stroke-width="1"
      />
      <For each={TIME_LABELS}>
        {(tl) => {
          const x = TL_PAD + (tl.hour / 24) * TL_TRACK;
          return (
            <>
              <line
                x1={x}
                y1={lineY() - 3}
                x2={x}
                y2={lineY() + 3}
                stroke="rgba(255,255,255,0.15)"
                stroke-width="1"
              />
              <text
                x={x}
                y={lineY() + 13}
                text-anchor="middle"
                fill="rgba(255,255,255,0.2)"
                font-size="7"
              >
                {tl.label}
              </text>
            </>
          );
        }}
      </For>
      <For each={dots()}>
        {(dot) => (
          <circle
            cx={dot.cx}
            cy={lineY() + (dot.cy - baseY)}
            r={DOT_R}
            fill={dot.color}
            opacity="0.9"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => props.onHover(dot.time)}
            onMouseLeave={() => props.onHover(null)}
            onTouchStart={() => props.onHover(dot.time)}
          />
        )}
      </For>
    </svg>
  );
};

// ── View 2: Dot Row ──

const DotRowView: Component<{
  entries: Entry[];
  hoveredTime: string | null;
  onHover: (t: string | null) => void;
}> = (props) => {
  const sorted = () => [...props.entries].sort(byTime);
  return (
    <div class="flex flex-wrap gap-1.5 justify-center max-w-[240px]">
      <For each={sorted()}>
        {(entry) => {
          const color = entryColor(entry);
          const time = entryTime(entry);
          return (
            <span
              class="w-3.5 h-3.5 rounded-full shrink-0 cursor-pointer transition-transform"
              style={{
                "background-color": color,
                transform:
                  props.hoveredTime === time ? "scale(1.4)" : undefined,
              }}
              onMouseEnter={() => props.onHover(time)}
              onMouseLeave={() => props.onHover(null)}
              onTouchStart={() => props.onHover(time)}
            />
          );
        }}
      </For>
    </div>
  );
};

// ── View 4: Stacked Arcs ──

const ARC_W = 240;
const ARC_H = 140;
const ARC_CX = ARC_W / 2;
const ARC_CY = ARC_H - 10;
const BASE_R = 40;
const ARC_WIDTH = 6;
const ARC_GAP = 2;
const ARC_SPAN_DEG = 8;

interface ArcSegment extends Placed {
  startAngle: number;
  endAngle: number;
  radius: number;
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
  width: number,
): string {
  const s = (180 + startDeg) * (Math.PI / 180);
  const e = (180 + endDeg) * (Math.PI / 180);
  const outer = r + width / 2;
  const inner = r - width / 2;
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return [
    `M ${cx + outer * Math.cos(s)} ${cy + outer * Math.sin(s)}`,
    `A ${outer} ${outer} 0 ${largeArc} 1 ${cx + outer * Math.cos(e)} ${cy + outer * Math.sin(e)}`,
    `L ${cx + inner * Math.cos(e)} ${cy + inner * Math.sin(e)}`,
    `A ${inner} ${inner} 0 ${largeArc} 0 ${cx + inner * Math.cos(s)} ${cy + inner * Math.sin(s)}`,
    `Z`,
  ].join(" ");
}

function layoutArcs(entries: Entry[]): ArcSegment[] {
  const sorted = [...entries].sort(byTime);
  const arcs: ArcSegment[] = [];

  for (const entry of sorted) {
    const center = dayFraction(new Date(entry.created_at)) * 180;
    const start = center - ARC_SPAN_DEG / 2;
    const end = center + ARC_SPAN_DEG / 2;

    let ring = 0;
    const ringR = () => BASE_R + ring * (ARC_WIDTH + ARC_GAP);
    while (ring < 20) {
      const r = ringR();
      const overlaps = arcs.some(
        (a) =>
          Math.round(a.radius) === Math.round(r) &&
          start < a.endAngle &&
          end > a.startAngle,
      );
      if (!overlaps) break;
      ring++;
    }

    arcs.push({
      startAngle: start,
      endAngle: end,
      radius: ringR(),
      color: entryColor(entry),
      time: entryTime(entry),
    });
  }
  return arcs;
}

const ArcsView: Component<{
  entries: Entry[];
  onHover: (t: string | null) => void;
}> = (props) => {
  const MOOD_SIZE = 36;

  return (
    <svg
      width={ARC_W}
      height={ARC_H}
      viewBox={`0 0 ${ARC_W} ${ARC_H}`}
      class="max-w-[240px]"
    >
      <path
        d={`M ${ARC_CX - BASE_R} ${ARC_CY} A ${BASE_R} ${BASE_R} 0 0 0 ${ARC_CX + BASE_R} ${ARC_CY}`}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        stroke-width="1"
      />
      <For each={TIME_LABELS}>
        {(tl) => {
          const rad = (180 + (tl.hour / 24) * 180) * (Math.PI / 180);
          const r = BASE_R - 14;
          return (
            <text
              x={ARC_CX + r * Math.cos(rad)}
              y={ARC_CY + r * Math.sin(rad)}
              text-anchor="middle"
              dominant-baseline="central"
              fill="rgba(255,255,255,0.2)"
              font-size="8"
            >
              {tl.label}
            </text>
          );
        }}
      </For>
      <For each={layoutArcs(props.entries)}>
        {(arc) => (
          <path
            d={arcPath(
              ARC_CX,
              ARC_CY,
              arc.radius,
              arc.startAngle,
              arc.endAngle,
              ARC_WIDTH,
            )}
            fill={arc.color}
            opacity="0.85"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => props.onHover(arc.time)}
            onMouseLeave={() => props.onHover(null)}
            onTouchStart={() => props.onHover(arc.time)}
          />
        )}
      </For>
      {/* Center: average mood mini-triangle */}
      <foreignObject
        x={ARC_CX - MOOD_SIZE / 2}
        y={ARC_CY - MOOD_SIZE - 2}
        width={MOOD_SIZE}
        height={MOOD_SIZE}
      >
        <MoodDot entries={props.entries} size={MOOD_SIZE} />
      </foreignObject>
    </svg>
  );
};

// ── Main Component ──

const EntryList: Component = () => {
  const [viewMode, setViewMode] = createSignal<ViewMode>(loadViewMode());
  const [hoveredTime, setHoveredTime] = createSignal<string | null>(null);

  function selectView(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem("triffect-view-mode", mode);
  }

  const query = client
    .query("entries")
    .Where("created_at", ">=", startOfToday())
    .Order("created_at", "DESC");
  const { results, fetchingLocal } = useQuery(client, query);
  const entries = () => [...(results()?.values() ?? [])];

  return (
    <div class="flex flex-col items-center my-4">
      <div class="flex items-center justify-center gap-2 mb-2">
        <h2 class="text-sm font-medium text-gray-400">Today</h2>
        <Show when={entries().length > 0}>
          <div class="flex rounded-md bg-gray-800 p-0.5 gap-0.5">
            <For each={VIEW_MODES}>
              {(mode) => (
                <button
                  onClick={() => selectView(mode)}
                  class={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                    viewMode() === mode
                      ? "bg-gray-700 text-gray-200"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                  title={mode}
                >
                  {VIEW_ICONS[mode]}
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>
      <Show
        when={!fetchingLocal()}
        fallback={<p class="text-xs text-gray-500">Loading...</p>}
      >
        <Show
          when={entries().length > 0}
          fallback={<p class="text-xs text-gray-500">No entries yet today</p>}
        >
          <Switch>
            <Match when={viewMode() === "timeline"}>
              <TimelineView entries={entries()} onHover={setHoveredTime} />
            </Match>
            <Match when={viewMode() === "dots"}>
              <DotRowView
                entries={entries()}
                hoveredTime={hoveredTime()}
                onHover={setHoveredTime}
              />
            </Match>
            <Match when={viewMode() === "arcs"}>
              <ArcsView entries={entries()} onHover={setHoveredTime} />
            </Match>
          </Switch>
          <span
            class="text-xs text-gray-400 h-4 text-center"
            style={{ visibility: hoveredTime() ? "visible" : "hidden" }}
          >
            {hoveredTime() ?? "\u00A0"}
          </span>
        </Show>
      </Show>
    </div>
  );
};

export default EntryList;
