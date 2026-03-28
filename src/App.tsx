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
          class="text-[11px] text-gray-600 hover:text-gray-400"
          target="_blank"
          rel="noopener"
        >
          source
        </a>
      </footer>
    </div>
  );
};

export default App;
