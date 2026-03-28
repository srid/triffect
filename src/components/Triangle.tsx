import { Component, createSignal, createMemo } from "solid-js";
import {
  triangleVertices,
  pixelToBarycentric,
  barycentricToPixel,
  isInsideTriangle,
  type Barycentric,
  type Point,
} from "../lib/coords";

const SIZE = 320;
const PADDING = 24;

interface Props {
  onSelect: (coords: Barycentric) => void;
  selected?: Barycentric;
}

const Triangle: Component<Props> = (props) => {
  const verts = createMemo(() => triangleVertices(SIZE, PADDING));

  const [hovered, setHovered] = createSignal<Point | null>(null);

  const selectedPixel = createMemo(() => {
    if (!props.selected) return null;
    return barycentricToPixel(props.selected, verts());
  });

  function handleClick(e: MouseEvent | TouchEvent) {
    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const p: Point = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
    if (isInsideTriangle(p, verts())) {
      props.onSelect(pixelToBarycentric(p, verts()));
    }
  }

  function handleMove(e: MouseEvent | TouchEvent) {
    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const p: Point = { x: clientX - rect.left, y: clientY - rect.top };
    if (isInsideTriangle(p, verts())) {
      setHovered(p);
    } else {
      setHovered(null);
    }
  }

  const v = () => verts();

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      class="cursor-crosshair touch-none select-none"
      onClick={handleClick}
      onTouchStart={handleClick}
      onMouseMove={handleMove}
      onMouseLeave={() => setHovered(null)}
    >
      <defs>
        {/* Three overlapping gradients to create smooth 3-color blend */}
        <linearGradient
          id="grad-bad"
          x1={v().bad.x / SIZE}
          y1={v().bad.y / SIZE}
          x2={v().good.x / SIZE}
          y2={v().good.y / SIZE}
        >
          <stop offset="0%" stop-color="rgb(220, 38, 38)" stop-opacity="1" />
          <stop offset="100%" stop-color="rgb(220, 38, 38)" stop-opacity="0" />
        </linearGradient>
        <linearGradient
          id="grad-good"
          x1={v().good.x / SIZE}
          y1={v().good.y / SIZE}
          x2={v().felicitous.x / SIZE}
          y2={v().felicitous.y / SIZE}
        >
          <stop offset="0%" stop-color="rgb(236, 72, 153)" stop-opacity="1" />
          <stop offset="100%" stop-color="rgb(236, 72, 153)" stop-opacity="0" />
        </linearGradient>
        <linearGradient
          id="grad-felicitous"
          x1={v().felicitous.x / SIZE}
          y1={v().felicitous.y / SIZE}
          x2={v().bad.x / SIZE}
          y2={v().bad.y / SIZE}
        >
          <stop offset="0%" stop-color="rgb(34, 197, 94)" stop-opacity="1" />
          <stop offset="100%" stop-color="rgb(34, 197, 94)" stop-opacity="0" />
        </linearGradient>
      </defs>

      {/* Triangle with layered gradients */}
      <polygon
        points={`${v().bad.x},${v().bad.y} ${v().good.x},${v().good.y} ${v().felicitous.x},${v().felicitous.y}`}
        fill="url(#grad-bad)"
        stroke="none"
      />
      <polygon
        points={`${v().bad.x},${v().bad.y} ${v().good.x},${v().good.y} ${v().felicitous.x},${v().felicitous.y}`}
        fill="url(#grad-good)"
        stroke="none"
        style="mix-blend-mode: screen"
      />
      <polygon
        points={`${v().bad.x},${v().bad.y} ${v().good.x},${v().good.y} ${v().felicitous.x},${v().felicitous.y}`}
        fill="url(#grad-felicitous)"
        stroke="none"
        style="mix-blend-mode: screen"
      />

      {/* Border */}
      <polygon
        points={`${v().bad.x},${v().bad.y} ${v().good.x},${v().good.y} ${v().felicitous.x},${v().felicitous.y}`}
        fill="none"
        stroke="rgba(0,0,0,0.2)"
        stroke-width="1.5"
      />

      {/* Vertex labels */}
      <text
        x={v().bad.x}
        y={v().bad.y - 8}
        text-anchor="middle"
        class="text-xs fill-red-600 font-medium"
      >
        Bad
      </text>
      <text
        x={v().good.x - 8}
        y={v().good.y + 16}
        text-anchor="end"
        class="text-xs fill-pink-500 font-medium"
      >
        Good
      </text>
      <text
        x={v().felicitous.x + 8}
        y={v().felicitous.y + 16}
        text-anchor="start"
        class="text-xs fill-green-500 font-medium"
      >
        Felicitous
      </text>

      {/* Hover indicator */}
      {hovered() && (
        <circle
          cx={hovered()!.x}
          cy={hovered()!.y}
          r="4"
          fill="white"
          stroke="rgba(0,0,0,0.3)"
          stroke-width="1"
          opacity="0.7"
        />
      )}

      {/* Selected point */}
      {selectedPixel() && (
        <circle
          cx={selectedPixel()!.x}
          cy={selectedPixel()!.y}
          r="6"
          fill="white"
          stroke="rgba(0,0,0,0.5)"
          stroke-width="2"
        />
      )}
    </svg>
  );
};

export default Triangle;
