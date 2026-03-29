import { Component, For, createMemo } from "solid-js";
import { useQuery } from "@triplit/solid";
import { client } from "../lib/triplit";
import MoodDot from "./MoodDot";

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

  // Generate grid: exactly 4 rows (weeks), ending on today's column
  const grid = createMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Monday = 0, Sunday = 6
    const todayCol = today.getDay() === 0 ? 6 : today.getDay() - 1;
    // Go back to fill exactly 4 rows: 3 full weeks + current partial week up to today
    const totalDays = 3 * 7 + todayCol + 1;
    const days: { key: string; dayOfMonth: number }[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = daysAgo(i);
      days.push({ key: startOfDay(d), dayOfMonth: d.getDate() });
    }
    return days;
  });

  const isToday = (key: string) => key === startOfDay(new Date());

  // Streak: consecutive days with ≥1 entry, counting back from today
  const streak = createMemo(() => {
    const map = dayMap();
    let count = 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    while (map.has(startOfDay(d))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  });

  return (
    <div class="w-full max-w-xs px-1">
      <div class="flex items-baseline justify-between mb-1">
        <h2 class="text-sm font-medium text-gray-400">Last 4 weeks</h2>
        {streak() > 0 && (
          <span class="text-xs text-amber-500">{streak()} day streak</span>
        )}
      </div>
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
            const dotSize = () => {
              const a = agg();
              if (!a) return 0;
              return Math.min(24, 10 + a.count * 3);
            };
            const dayEntries = () => {
              const a = agg();
              if (!a) return [];
              return [
                {
                  good: a.good / a.count,
                  bad: a.bad / a.count,
                  naivete: a.naivete / a.count,
                },
              ];
            };

            return (
              <div
                class="aspect-square rounded flex items-center justify-center relative"
                classList={{
                  "bg-gray-900": !isToday(day.key),
                  "bg-gray-800 ring-1 ring-gray-600": isToday(day.key),
                }}
              >
                {agg() ? (
                  <MoodDot entries={dayEntries()} size={dotSize()} />
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
