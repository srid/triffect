import { Component, createSignal, Show } from "solid-js";
import Triangle from "./components/Triangle";
import EntryForm from "./components/EntryForm";
import EntryList from "./components/EntryList";
import type { Barycentric } from "./lib/coords";

const App: Component = () => {
  const [selected, setSelected] = createSignal<Barycentric | null>(null);

  function handleSaved() {
    setSelected(null);
  }

  return (
    <div class="min-h-screen bg-white flex flex-col items-center px-4 py-8 gap-6">
      <h1 class="text-lg font-semibold text-gray-800">Triffect</h1>

      <Triangle onSelect={setSelected} selected={selected() ?? undefined} />

      <Show when={selected()}>
        <EntryForm coords={selected()!} onSaved={handleSaved} />
      </Show>

      <EntryList />
    </div>
  );
};

export default App;
