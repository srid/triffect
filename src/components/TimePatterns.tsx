import {
  type Component,
  createMemo,
  createSignal,
  For,
  onMount,
  Show,
} from "solid-js";
import { useQuery } from "@triplit/solid";
import { client } from "../lib/triplit";
import MoodDot from "./MoodDot";
import { sunTimes, formatHour } from "../lib/sun";
import type { Barycentric } from "../lib/coords";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

type GeoState =
  | { status: "loading" }
  | { status: "ok"; sunrise: number; sunset: number }
  | { status: "error"; message: string };

const TimePatterns: Component = () => {
  const [geo, setGeo] = createSignal<GeoState>({ status: "loading" });

  onMount(() => {
    if (!navigator.geolocation) {
      setGeo({ status: "error", message: "Geolocation not available" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { sunrise, sunset } = sunTimes(
          new Date(),
          pos.coords.latitude,
          pos.coords.longitude,
        );
        console.log(
          `[TimePatterns] lat=${pos.coords.latitude.toFixed(2)} lng=${pos.coords.longitude.toFixed(2)} sunrise=${formatHour(sunrise)} sunset=${formatHour(sunset)}`,
        );
        setGeo({ status: "ok", sunrise, sunset });
      },
      (err) => {
        setGeo({ status: "error", message: err.message });
      },
    );
  });

  // Average mood during day vs night over last 28 days
  const query = client.query("entries").Where("created_at", ">=", daysAgo(28));
  const { results } = useQuery(client, query);

  const buckets = createMemo(() => {
    const g = geo();
    if (g.status !== "ok") return [];
    return [
      {
        label: "Day",
        sub: `${formatHour(g.sunrise)}–${formatHour(g.sunset)}`,
        start: g.sunrise,
        end: g.sunset,
      },
      {
        label: "Night",
        sub: `${formatHour(g.sunset)}–${formatHour(g.sunrise)}`,
        start: g.sunset,
        end: g.sunrise,
      },
    ];
  });

  const bucketAverages = createMemo(() => {
    const entries = [...(results()?.values() ?? [])];
    if (entries.length === 0) return [];

    return buckets().map((bucket) => {
      const isDaytime = bucket.start < bucket.end;
      const inBucket = entries.filter((e) => {
        const h =
          new Date(e.created_at).getHours() +
          new Date(e.created_at).getMinutes() / 60;
        return isDaytime
          ? h >= bucket.start && h < bucket.end
          : h >= bucket.start || h < bucket.end;
      });
      const baryEntries: Barycentric[] = inBucket.map((e) => ({
        good: e.good,
        bad: e.bad,
        naivete: e.naivete,
      }));
      return { ...bucket, entries: baryEntries, count: inBucket.length };
    });
  });

  const hasData = () => bucketAverages().some((b) => b.count > 0);

  return (
    <div class="w-full max-w-xs px-1">
      <h2 class="text-sm font-medium text-gray-400 mb-1">
        Day vs Night{" "}
        <span class="font-normal text-gray-600">(last 28 days)</span>
      </h2>
      <Show when={geo().status === "loading"}>
        <p class="text-[10px] text-gray-600">Getting location...</p>
      </Show>
      <Show when={geo().status === "error"}>
        <p class="text-[10px] text-red-400">
          {(geo() as { status: "error"; message: string }).message}
        </p>
      </Show>
      <Show when={geo().status === "ok" && hasData()}>
        <div class="flex justify-center gap-6">
          <For each={bucketAverages()}>
            {(bucket) => (
              <div class="flex flex-col items-center gap-1">
                <Show
                  when={bucket.count > 0}
                  fallback={
                    <div
                      class="rounded bg-gray-900 flex items-center justify-center"
                      style={{ width: "44px", height: "44px" }}
                    >
                      <span class="text-[8px] text-gray-700">—</span>
                    </div>
                  }
                >
                  <MoodDot entries={bucket.entries} size={44} />
                </Show>
                <span class="text-[10px] text-gray-400">{bucket.label}</span>
                <span class="text-[8px] text-gray-600">{bucket.sub}</span>
                <span class="text-[8px] text-gray-600">
                  {bucket.count > 0 ? `${bucket.count} entries` : ""}
                </span>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default TimePatterns;
