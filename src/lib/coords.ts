/**
 * Triangle vertices in pixel space.
 * Naivete (green) at top, Bad (red) bottom-left, Good (pink) bottom-right.
 */
export interface Point {
  x: number;
  y: number;
}

export interface Barycentric {
  good: number;
  bad: number;
  naivete: number;
}

export interface TriangleVertices {
  naivete: Point; // top
  bad: Point; // bottom-left
  good: Point; // bottom-right
}

/** Compute vertices for an equilateral triangle centered in a square of given size. */
export function triangleVertices(
  size: number,
  padding: number = 20,
): TriangleVertices {
  const cx = size / 2;
  const r = size / 2 - padding;
  return {
    naivete: { x: cx, y: padding },
    bad: {
      x: cx - r * Math.cos(Math.PI / 6),
      y: padding + r + r * Math.sin(Math.PI / 6),
    },
    good: {
      x: cx + r * Math.cos(Math.PI / 6),
      y: padding + r + r * Math.sin(Math.PI / 6),
    },
  };
}

/** Raw barycentric coordinates (may be negative for points outside triangle). */
function rawBarycentric(p: Point, v: TriangleVertices): Barycentric {
  const denom =
    (v.bad.y - v.good.y) * (v.naivete.x - v.good.x) +
    (v.good.x - v.bad.x) * (v.naivete.y - v.good.y);
  const naivete =
    ((v.bad.y - v.good.y) * (p.x - v.good.x) +
      (v.good.x - v.bad.x) * (p.y - v.good.y)) /
    denom;
  const bad =
    ((v.good.y - v.naivete.y) * (p.x - v.good.x) +
      (v.naivete.x - v.good.x) * (p.y - v.good.y)) /
    denom;
  const good = 1 - naivete - bad;
  return { good, bad, naivete };
}

/** Convert pixel coordinates to barycentric (clamped to triangle). */
export function pixelToBarycentric(p: Point, v: TriangleVertices): Barycentric {
  const b = rawBarycentric(p, v);
  const good = Math.max(0, b.good);
  const bad = Math.max(0, b.bad);
  const naivete = Math.max(0, b.naivete);
  const sum = good + bad + naivete;
  return { good: good / sum, bad: bad / sum, naivete: naivete / sum };
}

/** Convert barycentric coordinates back to pixel position. */
export function barycentricToPixel(b: Barycentric, v: TriangleVertices): Point {
  return {
    x: b.naivete * v.naivete.x + b.bad * v.bad.x + b.good * v.good.x,
    y: b.naivete * v.naivete.y + b.bad * v.bad.y + b.good * v.good.y,
  };
}

/** Interpolate color from barycentric coordinates. */
export function barycentricToColor(b: Barycentric): string {
  // Bad = dark crimson (153,27,27), Good = hot pink (255,0,150), Naivete = green (34,197,94)
  const r = Math.round(b.bad * 153 + b.good * 255 + b.naivete * 34);
  const g = Math.round(b.bad * 27 + b.good * 0 + b.naivete * 197);
  const bl = Math.round(b.bad * 27 + b.good * 150 + b.naivete * 94);
  return `rgb(${r}, ${g}, ${bl})`;
}

/** Check if a point is inside the triangle using raw (unclamped) barycentric coords. */
export function isInsideTriangle(p: Point, v: TriangleVertices): boolean {
  const b = rawBarycentric(p, v);
  return b.good >= -0.001 && b.bad >= -0.001 && b.naivete >= -0.001;
}
