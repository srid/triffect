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

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

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

interface Bucket {
  label: string;
  sub: string;
  start: number;
  end: number;
}

interface BucketResult extends Bucket {
  entries: Barycentric[];
  count: number;
}

function classifyEntries(
  entries: Array<{
    good: number;
    bad: number;
    naivete: number;
    created_at: Date | string;
  }>,
  buckets: Bucket[],
): BucketResult[] {
  return buckets.map((bucket) => {
    const isDaytime = bucket.start < bucket.end;
    const inBucket = entries.filter((e) => {
      const h =
        new Date(e.created_at).getHours() +
        new Date(e.created_at).getMinutes() / 60;
      return isDaytime
        ? h >= bucket.start && h < bucket.end
        : h >= bucket.start || h < bucket.end;
    });
    return {
      ...bucket,
      entries: inBucket.map((e) => ({
        good: e.good,
        bad: e.bad,
        naivete: e.naivete,
      })),
      count: inBucket.length,
    };
  });
}

const TimePatterns: Component = () => {
  const [geo, setGeo] = createSignal<GeoState>({ status: "loading" });

  onMount(async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const lat = data.latitude;
      const lng = data.longitude;
      if (typeof lat !== "number" || typeof lng !== "number") {
        throw new Error("Invalid location data");
      }
      const { sunrise, sunset } = sunTimes(new Date(), lat, lng);
      console.log(
        `[TimePatterns] lat=${lat.toFixed(2)} lng=${lng.toFixed(2)} sunrise=${formatHour(sunrise)} sunset=${formatHour(sunset)}`,
      );
      setGeo({ status: "ok", sunrise, sunset });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.log("[TimePatterns] location error:", msg);
      setGeo({ status: "error", message: msg });
    }
  });

  const query = client.query("entries").Where("created_at", ">=", daysAgo(28));
  const { results } = useQuery(client, query);
  const allEntries = () => [...(results()?.values() ?? [])];

  const buckets = createMemo((): Bucket[] => {
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

  const timeRanges = createMemo(() => {
    const b = buckets();
    if (b.length === 0) return [];
    const all = allEntries();
    const today = startOfToday();
    const weekAgo = daysAgo(7);

    const todayEntries = all.filter((e) => new Date(e.created_at) >= today);
    const weekEntries = all.filter((e) => new Date(e.created_at) >= weekAgo);

    return [
      { label: "Today", data: classifyEntries(todayEntries, b) },
      { label: "7 days", data: classifyEntries(weekEntries, b) },
      { label: "28 days", data: classifyEntries(all, b) },
    ];
  });

  const hasData = () =>
    timeRanges().some((r) => r.data.some((b) => b.count > 0));

  return (
    <div class="w-full max-w-xs px-1">
      <h2 class="text-sm font-medium text-gray-400 mb-2">Day vs Night</h2>
      <Show when={geo().status === "loading"}>
        <p class="text-[10px] text-gray-600">Getting location...</p>
      </Show>
      <Show when={geo().status === "error"}>
        <p class="text-[10px] text-red-400">
          {(geo() as { status: "error"; message: string }).message}
        </p>
      </Show>
      <Show when={geo().status === "ok" && hasData()}>
        {(() => {
          const g = geo() as { status: "ok"; sunrise: number; sunset: number };
          return (
            <table class="w-full text-center text-[10px]">
              <thead>
                <tr class="text-gray-500">
                  <th />
                  <th class="font-normal pb-1">
                    Day
                    <span class="block text-[8px] text-gray-600">
                      {formatHour(g.sunrise)}–{formatHour(g.sunset)}
                    </span>
                  </th>
                  <th class="font-normal pb-1">
                    Night
                    <span class="block text-[8px] text-gray-600">
                      {formatHour(g.sunset)}–{formatHour(g.sunrise)}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={timeRanges()}>
                  {(range) => (
                    <Show when={range.data.some((b) => b.count > 0)}>
                      <tr>
                        <td class="text-gray-500 text-right pr-2 py-1">
                          {range.label}
                        </td>
                        <For each={range.data}>
                          {(bucket) => (
                            <td class="py-1">
                              <div class="flex flex-col items-center gap-0.5">
                                <Show
                                  when={bucket.count > 0}
                                  fallback={
                                    <span class="text-[8px] text-gray-700">
                                      —
                                    </span>
                                  }
                                >
                                  <MoodDot entries={bucket.entries} size={28} />
                                  <span class="text-[8px] text-gray-600">
                                    {bucket.count}
                                  </span>
                                </Show>
                              </div>
                            </td>
                          )}
                        </For>
                      </tr>
                    </Show>
                  )}
                </For>
              </tbody>
            </table>
          );
        })()}
      </Show>
    </div>
  );
};

export default TimePatterns;
