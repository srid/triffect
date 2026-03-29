import { type Component, Show } from "solid-js";
import {
  averageColor,
  barycentricToColor,
  type Barycentric,
} from "../lib/coords";

interface Props {
  entries: ReadonlyArray<Barycentric>;
  size: number;
}

/** Mini triangle showing the three mood vertices with a dot at the average position. */
const MoodDot: Component<Props> = (props) => {
  const avg = () => {
    const es = props.entries;
    if (es.length === 0) return undefined;
    const sum: Barycentric = { good: 0, bad: 0, naivete: 0 };
    for (const e of es) {
      sum.good += e.good;
      sum.bad += e.bad;
      sum.naivete += e.naivete;
    }
    return {
      good: sum.good / es.length,
      bad: sum.bad / es.length,
      naivete: sum.naivete / es.length,
    } as Barycentric;
  };

  const color = () => {
    const a = avg();
    return a ? barycentricToColor(a) : undefined;
  };

  // Triangle geometry within a unit square [0, size] x [0, size]
  const pad = () => props.size * 0.05;
  const verts = () => {
    const s = props.size;
    const p = pad();
    const triH = (s - p * 2) * (Math.sqrt(3) / 2);
    const topY = (s - triH) / 2;
    return {
      naivete: { x: s / 2, y: topY },
      bad: { x: p, y: topY + triH },
      good: { x: s - p, y: topY + triH },
    };
  };

  const dotPos = () => {
    const a = avg();
    const v = verts();
    if (!a) return undefined;
    return {
      x: a.naivete * v.naivete.x + a.bad * v.bad.x + a.good * v.good.x,
      y: a.naivete * v.naivete.y + a.bad * v.bad.y + a.good * v.good.y,
    };
  };

  const triPath = () => {
    const v = verts();
    return `M ${v.naivete.x} ${v.naivete.y} L ${v.bad.x} ${v.bad.y} L ${v.good.x} ${v.good.y} Z`;
  };

  return (
    <Show when={color()}>
      <svg
        width={props.size}
        height={props.size}
        viewBox={`0 0 ${props.size} ${props.size}`}
      >
        <path d={triPath()} fill={color()} opacity="0.5" />
        <Show when={dotPos()}>
          <circle
            cx={dotPos()!.x}
            cy={dotPos()!.y}
            r={props.size * 0.07}
            fill="black"
          />
        </Show>
      </svg>
    </Show>
  );
};

export default MoodDot;
