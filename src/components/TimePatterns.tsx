import { type Component, createMemo, For, Show } from "solid-js";
import { useQuery } from "@triplit/solid";
import { client } from "../lib/triplit";
import MoodDot from "./MoodDot";
import type { Barycentric } from "../lib/coords";

const BUCKETS = [
  { label: "Night", start: 0, end: 6 },
  { label: "Morning", start: 6, end: 12 },
  { label: "Afternoon", start: 12, end: 18 },
  { label: "Evening", start: 18, end: 24 },
] as const;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

const TimePatterns: Component = () => {
  const query = client.query("entries").Where("created_at", ">=", daysAgo(28));
  const { results } = useQuery(client, query);

  const bucketAverages = createMemo(() => {
    const entries = [...(results()?.values() ?? [])];
    if (entries.length === 0) return [];

    return BUCKETS.map((bucket) => {
      const inBucket = entries.filter((e) => {
        const h = new Date(e.created_at).getHours();
        return h >= bucket.start && h < bucket.end;
      });
      if (inBucket.length === 0)
        return { ...bucket, entries: [] as Barycentric[], count: 0 };
      const avg: Barycentric[] = inBucket.map((e) => ({
        good: e.good,
        bad: e.bad,
        naivete: e.naivete,
      }));
      return { ...bucket, entries: avg, count: inBucket.length };
    });
  });

  const hasData = () => bucketAverages().some((b) => b.count > 0);

  return (
    <Show when={hasData()}>
      <div class="w-full max-w-xs px-1">
        <h2 class="text-sm font-medium text-gray-400 mb-1">Time of day</h2>
        <div class="flex justify-between gap-1">
          <For each={bucketAverages()}>
            {(bucket) => (
              <div class="flex flex-col items-center gap-1 flex-1">
                <Show
                  when={bucket.count > 0}
                  fallback={
                    <div
                      class="rounded bg-gray-900 flex items-center justify-center"
                      style={{ width: "36px", height: "36px" }}
                    >
                      <span class="text-[8px] text-gray-700">—</span>
                    </div>
                  }
                >
                  <MoodDot entries={bucket.entries} size={36} />
                </Show>
                <span class="text-[9px] text-gray-500">{bucket.label}</span>
                <span class="text-[8px] text-gray-600">
                  {bucket.count > 0 ? `${bucket.count}` : ""}
                </span>
              </div>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
};

export default TimePatterns;
