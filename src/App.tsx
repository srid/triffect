import { Component, createSignal, Show } from "solid-js";
import Triangle from "./components/Triangle";
import EntryForm from "./components/EntryForm";
import EntryList from "./components/EntryList";
import Calendar from "./components/Calendar";
import type { Barycentric } from "./lib/coords";

const App: Component = () => {
  const [selected, setSelected] = createSignal<Barycentric | null>(null);

  function handleSaved() {
    setSelected(null);
  }

  return (
    <div class="min-h-screen bg-gray-950 flex flex-col items-center px-3 py-3 gap-2">
      <h1 class="text-base font-semibold text-gray-200">Triffect</h1>

      <Triangle onSelect={setSelected} selected={selected() ?? undefined} />

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
