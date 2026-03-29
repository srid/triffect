import { type Component, createMemo, createSignal } from "solid-js";
import { useQuery } from "@triplit/solid";
import Triangle from "./components/Triangle";
import EntryList from "./components/EntryList";
import Calendar from "./components/Calendar";
import { client } from "./lib/triplit";
import { averageColor, type Barycentric } from "./lib/coords";

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

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const App: Component = () => {
  const todayQuery = client
    .query("entries")
    .Where("created_at", ">=", startOfToday());
  const { results: todayResults } = useQuery(client, todayQuery);

  const todayEntries = createMemo(() => [...(todayResults()?.values() ?? [])]);

  const glowColor = createMemo(() => averageColor(todayEntries()));

  const [selectedDay, setSelectedDay] = createSignal<string | null>(null);

  // Past 28 days (excluding today) for weekly averages + day comparison
  const pastQuery = client
    .query("entries")
    .Where("created_at", ">=", daysAgo(28))
    .Where("created_at", "<", startOfToday());
  const { results: pastResults } = useQuery(client, pastQuery);

  interface PastEntry extends Barycentric {
    created_at: Date | string;
  }

  const pastByDay = createMemo(() => {
    const map = new Map<string, PastEntry[]>();
    for (const e of pastResults()?.values() ?? []) {
      const key = dateKey(new Date(e.created_at));
      const arr = map.get(key) ?? [];
      arr.push({
        good: e.good,
        bad: e.bad,
        naivete: e.naivete,
        created_at: e.created_at,
      });
      map.set(key, arr);
    }
    return map;
  });

  const weeklyAverages = createMemo(() => {
    const avgs: Barycentric[] = [];
    const sevenDaysAgo = daysAgo(7);
    for (const [key, dayEntries] of pastByDay()) {
      if (new Date(key + "T00:00:00") < sevenDaysAgo) continue;
      const sum = { good: 0, bad: 0, naivete: 0 };
      for (const e of dayEntries) {
        sum.good += e.good;
        sum.bad += e.bad;
        sum.naivete += e.naivete;
      }
      avgs.push({
        good: sum.good / dayEntries.length,
        bad: sum.bad / dayEntries.length,
        naivete: sum.naivete / dayEntries.length,
      });
    }
    return avgs;
  });

  // Entries for selected calendar day
  const selectedDayEntries = createMemo(() => {
    const day = selectedDay();
    if (!day) return undefined;
    return pastByDay().get(day);
  });

  const selectedDayLabel = createMemo(() => {
    const day = selectedDay();
    if (!day) return undefined;
    const d = new Date(day + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  });

  return (
    <div class="min-h-screen bg-gray-950 flex flex-col items-center px-3 py-3 gap-2">
      <h1 class="text-base font-semibold text-gray-200">Triffect</h1>

      <Triangle
        glowColor={glowColor()}
        todayEntries={todayEntries()}
        weeklyAverages={weeklyAverages()}
      />

      <p class="text-[10px] text-gray-600">Tap to log mood</p>

      <EntryList
        entries={selectedDayEntries() ?? undefined}
        label={selectedDayLabel() ?? undefined}
      />

      <Calendar
        selectedDay={selectedDay() ?? undefined}
        onDaySelect={setSelectedDay}
      />

      <footer class="text-center mt-3 max-w-xs px-1 space-y-1">
        <p class="text-[11px] text-gray-600 leading-snug">
          <b class="text-green-600">Sensuous</b> — felicitous and innocuous
          feelings (delightful, harmonious). <b class="text-red-500">'Bad'</b> —
          hostile and invidious passions (hateful, fearful).{" "}
          <b class="text-pink-500">'Good'</b> — affectionate and desirable
          passions (loving, trusting).{" "}
          <a
            href="https://actualfreedom.com.au/sundry/frequentquestions/FAQ63a.htm"
            class="underline hover:text-gray-400"
            target="_blank"
            rel="noopener"
          >
            source
          </a>
        </p>
        <a
          href="https://github.com/srid/triffect"
          class="inline-block text-gray-600 hover:text-gray-400"
          target="_blank"
          rel="noopener"
          aria-label="Source on GitHub"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </footer>
    </div>
  );
};

export default App;
