/**
 * Triangle vertices in pixel space.
 * Bad (red) at top, Good (pink) bottom-left, Felicitous (green) bottom-right.
 */
export interface Point {
  x: number;
  y: number;
}

export interface Barycentric {
  good: number;
  bad: number;
  felicitous: number;
}

export interface TriangleVertices {
  bad: Point; // top
  good: Point; // bottom-left
  felicitous: Point; // bottom-right
}

/** Compute vertices for an equilateral triangle centered in a square of given size. */
export function triangleVertices(
  size: number,
  padding: number = 20,
): TriangleVertices {
  const cx = size / 2;
  const r = size / 2 - padding;
  return {
    bad: { x: cx, y: padding },
    good: {
      x: cx - r * Math.cos(Math.PI / 6),
      y: padding + r + r * Math.sin(Math.PI / 6),
    },
    felicitous: {
      x: cx + r * Math.cos(Math.PI / 6),
      y: padding + r + r * Math.sin(Math.PI / 6),
    },
  };
}

/** Convert pixel coordinates to barycentric using area method. */
export function pixelToBarycentric(p: Point, v: TriangleVertices): Barycentric {
  const area = triangleArea(v.bad, v.good, v.felicitous);
  const bad = triangleArea(p, v.good, v.felicitous) / area;
  const good = triangleArea(v.bad, p, v.felicitous) / area;
  const felicitous = 1 - bad - good;
  return clampBarycentric({ good, bad, felicitous });
}

/** Convert barycentric coordinates back to pixel position. */
export function barycentricToPixel(b: Barycentric, v: TriangleVertices): Point {
  return {
    x: b.bad * v.bad.x + b.good * v.good.x + b.felicitous * v.felicitous.x,
    y: b.bad * v.bad.y + b.good * v.good.y + b.felicitous * v.felicitous.y,
  };
}

/** Interpolate color from barycentric coordinates. */
export function barycentricToColor(b: Barycentric): string {
  // Bad = red (220, 38, 38), Good = pink (236, 72, 153), Felicitous = green (34, 197, 94)
  const r = Math.round(b.bad * 220 + b.good * 236 + b.felicitous * 34);
  const g = Math.round(b.bad * 38 + b.good * 72 + b.felicitous * 197);
  const bl = Math.round(b.bad * 38 + b.good * 153 + b.felicitous * 94);
  return `rgb(${r}, ${g}, ${bl})`;
}

/** Check if a point is inside the triangle. */
export function isInsideTriangle(p: Point, v: TriangleVertices): boolean {
  const b = pixelToBarycentric(p, v);
  return b.good >= -0.01 && b.bad >= -0.01 && b.felicitous >= -0.01;
}

function triangleArea(a: Point, b: Point, c: Point): number {
  return Math.abs(
    (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2,
  );
}

function clampBarycentric(b: Barycentric): Barycentric {
  const good = Math.max(0, Math.min(1, b.good));
  const bad = Math.max(0, Math.min(1, b.bad));
  const felicitous = Math.max(0, Math.min(1, b.felicitous));
  const sum = good + bad + felicitous;
  return { good: good / sum, bad: bad / sum, felicitous: felicitous / sum };
}
