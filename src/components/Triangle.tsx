import { Component, createSignal, createMemo, onMount } from "solid-js";
import {
  triangleVertices,
  pixelToBarycentric,
  barycentricToPixel,
  isInsideTriangle,
  type Barycentric,
  type Point,
} from "../lib/coords";

// Canvas dimensions: wide enough for labels, tall enough for triangle + labels
const W = 640;
const PADDING_X = 60;
const PADDING_TOP = 50; // space for top label
const PADDING_BOTTOM = 40; // space for bottom labels

// Vertex colors: Naivete = green, Bad = dark crimson, Good = hot pink/magenta
const NAIVETE_COLOR = [34, 197, 94] as const;
const BAD_COLOR = [153, 27, 27] as const;
const GOOD_COLOR = [255, 0, 150] as const;

interface Props {
  onSelect: (coords: Barycentric) => void;
  selected?: Barycentric;
}

/** Distance from point to line segment. Used for anti-aliased edges. */
function distToEdge(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2),
  );
  const px = a.x + t * dx - p.x;
  const py = a.y + t * dy - p.y;
  return Math.sqrt(px * px + py * py);
}

// Compute triangle size from canvas width
const triWidth = W - PADDING_X * 2;
const triHeight = triWidth * (Math.sqrt(3) / 2);
const H = PADDING_TOP + triHeight + PADDING_BOTTOM;

const Triangle: Component<Props> = (props) => {
  let canvasRef!: HTMLCanvasElement;

  // Vertices positioned within the canvas
  const verts = createMemo(() => ({
    naivete: { x: W / 2, y: PADDING_TOP },
    bad: { x: PADDING_X, y: PADDING_TOP + triHeight },
    good: { x: W - PADDING_X, y: PADDING_TOP + triHeight },
  }));

  const [hovered, setHovered] = createSignal<Point | null>(null);

  const selectedPixel = createMemo(() => {
    if (!props.selected) return null;
    return barycentricToPixel(props.selected, verts());
  });

  onMount(() => {
    const ctx = canvasRef.getContext("2d")!;
    const v = verts();
    const imageData = ctx.createImageData(W, Math.ceil(H));
    const data = imageData.data;
    const h = Math.ceil(H);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < W; x++) {
        const p = { x, y };
        if (isInsideTriangle(p, v)) {
          const b = pixelToBarycentric(p, v);
          const idx = (y * W + x) * 4;
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
          const d = Math.min(
            distToEdge(p, v.naivete, v.bad),
            distToEdge(p, v.bad, v.good),
            distToEdge(p, v.good, v.naivete),
          );
          data[idx + 3] = d < 1.5 ? Math.round((d / 1.5) * 255) : 255;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  });

  function getPoint(e: MouseEvent | TouchEvent): Point {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
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
      class="relative cursor-crosshair touch-none select-none w-full max-w-xs"
      style={{ "aspect-ratio": `${W} / ${Math.ceil(H)}` }}
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={Math.ceil(H)}
        class="absolute inset-0 w-full h-full"
        onClick={handleClick}
        onTouchStart={handleClick}
        onMouseMove={handleMove}
        onMouseLeave={() => setHovered(null)}
      />
      <svg
        viewBox={`0 0 ${W} ${Math.ceil(H)}`}
        class="absolute inset-0 w-full h-full pointer-events-none"
      >
        <text
          x={v().naivete.x}
          y={v().naivete.y - 12}
          text-anchor="middle"
          class="fill-green-400 font-medium"
          font-size="22"
        >
          Naivete
        </text>
        <text
          x={v().bad.x}
          y={v().bad.y + 26}
          text-anchor="middle"
          class="fill-red-400 font-medium"
          font-size="22"
        >
          Bad
        </text>
        <text
          x={v().good.x}
          y={v().good.y + 26}
          text-anchor="middle"
          class="fill-pink-400 font-medium"
          font-size="22"
        >
          Good
        </text>

        {hovered() && (
          <circle
            cx={hovered()!.x}
            cy={hovered()!.y}
            r="8"
            fill="white"
            stroke="rgba(0,0,0,0.3)"
            stroke-width="2"
            opacity="0.7"
          />
        )}

        {selectedPixel() && (
          <circle
            cx={selectedPixel()!.x}
            cy={selectedPixel()!.y}
            r="12"
            fill="white"
            stroke="rgba(0,0,0,0.5)"
            stroke-width="3"
          />
        )}
      </svg>
    </div>
  );
};

export default Triangle;
