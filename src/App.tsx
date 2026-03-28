import { Component, createSignal, createMemo, Show } from "solid-js";
import { useQuery } from "@triplit/solid";
import Triangle from "./components/Triangle";
import EntryForm from "./components/EntryForm";
import EntryList from "./components/EntryList";
import Calendar from "./components/Calendar";
import { client } from "./lib/triplit";
import { barycentricToColor, type Barycentric } from "./lib/coords";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const App: Component = () => {
  const [selected, setSelected] = createSignal<Barycentric | null>(null);

  // Today's entries for glow color
  const todayQuery = client
    .query("entries")
    .Where("created_at", ">=", startOfToday());
  const { results: todayResults } = useQuery(client, todayQuery);

  const glowColor = createMemo(() => {
    const entries = [...(todayResults()?.values() ?? [])];
    if (entries.length === 0) return undefined;
    const avg: Barycentric = { good: 0, bad: 0, naivete: 0 };
    for (const e of entries) {
      avg.good += e.good;
      avg.bad += e.bad;
      avg.naivete += e.naivete;
    }
    avg.good /= entries.length;
    avg.bad /= entries.length;
    avg.naivete /= entries.length;
    return barycentricToColor(avg);
  });

  function handleSaved() {
    setSelected(null);
  }

  return (
    <div class="min-h-screen bg-gray-950 flex flex-col items-center px-3 py-3 gap-2">
      <h1 class="text-base font-semibold text-gray-200">Triffect</h1>

      <Triangle
        onSelect={setSelected}
        selected={selected() ?? undefined}
        glowColor={glowColor()}
      />

      <Show when={selected()}>
        <EntryForm coords={selected()!} onSaved={handleSaved} />
      </Show>

      <EntryList />

      <Calendar />

      <a
        href="https://github.com/srid/triffect"
        class="text-xs text-gray-600 hover:text-gray-400 mt-2"
        target="_blank"
        rel="noopener"
      >
        source
      </a>
    </div>
  );
};

export default App;
