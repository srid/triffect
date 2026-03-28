import { Component, For, createMemo } from "solid-js";
import { useQuery } from "@triplit/solid";
import { client } from "../lib/triplit";
import { barycentricToColor, type Barycentric } from "../lib/coords";

const WEEKS = 4;
const DAYS = WEEKS * 7;

function startOfDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const Calendar: Component = () => {
  const since = daysAgo(DAYS - 1);
  const query = client
    .query("entries")
    .Where("created_at", ">=", since)
    .Order("created_at", "ASC");
  const { results, fetchingLocal } = useQuery(client, query);

  // Group entries by day → average barycentric color + count
  const dayMap = createMemo(() => {
    const map = new Map<
      string,
      { good: number; bad: number; naivete: number; count: number }
    >();
    for (const entry of results()?.values() ?? []) {
      const key = startOfDay(new Date(entry.created_at));
      const existing = map.get(key);
      if (existing) {
        existing.good += entry.good;
        existing.bad += entry.bad;
        existing.naivete += entry.naivete;
        existing.count += 1;
      } else {
        map.set(key, {
          good: entry.good,
          bad: entry.bad,
          naivete: entry.naivete,
          count: 1,
        });
      }
    }
    return map;
  });

  // Generate grid: last 4 weeks, aligned to Monday start
  const grid = createMemo(() => {
    const days: { key: string; date: Date; dayOfMonth: number }[] = [];
    const today = new Date();
    // Find the Monday of the week containing (today - DAYS + 1)
    const start = daysAgo(DAYS - 1);
    const dow = start.getDay();
    const mondayOffset = dow === 0 ? 6 : dow - 1; // days since Monday
    start.setDate(start.getDate() - mondayOffset);

    const end = new Date(today);
    const d = new Date(start);
    while (d <= end) {
      days.push({
        key: startOfDay(d),
        date: new Date(d),
        dayOfMonth: d.getDate(),
      });
      d.setDate(d.getDate() + 1);
    }
    return days;
  });

  const isToday = (key: string) => key === startOfDay(new Date());

  return (
    <div class="w-full max-w-xs px-1">
      <h2 class="text-sm font-medium text-gray-400 mb-1">Last 4 weeks</h2>
      <div
        class="grid gap-[3px]"
        style={{ "grid-template-columns": "repeat(7, 1fr)" }}
      >
        <For each={DAY_LABELS}>
          {(label) => (
            <div class="text-center text-[10px] text-gray-600 pb-0.5">
              {label}
            </div>
          )}
        </For>
        <For each={grid()}>
          {(day) => {
            const agg = () => dayMap().get(day.key);
            const color = () => {
              const a = agg();
              if (!a) return undefined;
              const b: Barycentric = {
                good: a.good / a.count,
                bad: a.bad / a.count,
                naivete: a.naivete / a.count,
              };
              return barycentricToColor(b);
            };
            const dotSize = () => {
              const a = agg();
              if (!a) return 0;
              return Math.min(24, 10 + a.count * 3);
            };

            return (
              <div
                class="aspect-square rounded flex items-center justify-center relative"
                classList={{
                  "bg-gray-900": !isToday(day.key),
                  "bg-gray-800 ring-1 ring-gray-600": isToday(day.key),
                }}
              >
                {color() ? (
                  <span
                    class="rounded-full"
                    style={{
                      "background-color": color(),
                      width: `${dotSize()}px`,
                      height: `${dotSize()}px`,
                    }}
                  />
                ) : (
                  <span class="text-[9px] text-gray-700">{day.dayOfMonth}</span>
                )}
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default Calendar;
