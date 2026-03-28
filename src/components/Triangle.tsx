import { Component, createSignal, createMemo, onMount } from "solid-js";
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

// Vertex colors: Naivete = green, Bad = dark crimson, Good = hot pink/magenta
const NAIVETE_COLOR = [34, 197, 94] as const;
const BAD_COLOR = [153, 27, 27] as const;
const GOOD_COLOR = [255, 0, 150] as const;

interface Props {
  onSelect: (coords: Barycentric) => void;
  selected?: Barycentric;
}

const Triangle: Component<Props> = (props) => {
  let canvasRef!: HTMLCanvasElement;
  const verts = createMemo(() => triangleVertices(SIZE, PADDING));

  const [hovered, setHovered] = createSignal<Point | null>(null);

  const selectedPixel = createMemo(() => {
    if (!props.selected) return null;
    return barycentricToPixel(props.selected, verts());
  });

  onMount(() => {
    const ctx = canvasRef.getContext("2d")!;
    const v = verts();
    const imageData = ctx.createImageData(SIZE, SIZE);
    const data = imageData.data;

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const p = { x, y };
        if (isInsideTriangle(p, v)) {
          const b = pixelToBarycentric(p, v);
          const idx = (y * SIZE + x) * 4;
          data[idx] = Math.round(
            b.naivete * NAIVETE_COLOR[0] +
              b.bad * BAD_COLOR[0] +
              b.good * GOOD_COLOR[0],
          );
          data[idx + 1] = Math.round(
            b.naivete * NAIVETE_COLOR[1] +
              b.bad * BAD_COLOR[1] +
              b.good * GOOD_COLOR[1],
          );
          data[idx + 2] = Math.round(
            b.naivete * NAIVETE_COLOR[2] +
              b.bad * BAD_COLOR[2] +
              b.good * GOOD_COLOR[2],
          );
          data[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Draw border
    ctx.beginPath();
    ctx.moveTo(v.naivete.x, v.naivete.y);
    ctx.lineTo(v.bad.x, v.bad.y);
    ctx.lineTo(v.good.x, v.good.y);
    ctx.closePath();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  function getPoint(e: MouseEvent | TouchEvent): Point {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * SIZE,
      y: ((clientY - rect.top) / rect.height) * SIZE,
    };
  }

  function handleClick(e: MouseEvent | TouchEvent) {
    const p = getPoint(e);
    if (isInsideTriangle(p, verts())) {
      props.onSelect(pixelToBarycentric(p, verts()));
    }
  }

  function handleMove(e: MouseEvent) {
    const p = getPoint(e);
    if (isInsideTriangle(p, verts())) {
      setHovered(p);
    } else {
      setHovered(null);
    }
  }

  const v = () => verts();

  return (
    <div
      class="relative cursor-crosshair touch-none select-none"
      style={{ width: `${SIZE}px`, height: `${SIZE}px` }}
    >
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        class="absolute inset-0 w-full h-full"
        onClick={handleClick}
        onTouchStart={handleClick}
        onMouseMove={handleMove}
        onMouseLeave={() => setHovered(null)}
      />
      {/* Labels and markers as SVG overlay */}
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        class="absolute inset-0 pointer-events-none"
      >
        <text
          x={v().naivete.x}
          y={v().naivete.y - 8}
          text-anchor="middle"
          class="text-xs fill-green-400 font-medium"
        >
          Naivete
        </text>
        <text
          x={v().bad.x - 8}
          y={v().bad.y + 16}
          text-anchor="end"
          class="text-xs fill-red-400 font-medium"
        >
          Bad
        </text>
        <text
          x={v().good.x + 8}
          y={v().good.y + 16}
          text-anchor="start"
          class="text-xs fill-pink-400 font-medium"
        >
          Good
        </text>

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
    </div>
  );
};

export default Triangle;
