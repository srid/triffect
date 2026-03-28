import { Component, createSignal } from "solid-js";
import { ulid } from "ulid";
import { client } from "../lib/triplit";
import type { Barycentric } from "../lib/coords";

interface Props {
  coords: Barycentric;
  onSaved: () => void;
}

const EntryForm: Component<Props> = (props) => {
  const [note, setNote] = createSignal("");
  const [saving, setSaving] = createSignal(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setSaving(true);
    try {
      await client.insert("entries", {
        id: ulid(),
        good: props.coords.good,
        bad: props.coords.bad,
        naivete: props.coords.naivete,
        note: note() || undefined,
        created_at: new Date(),
      });
      setNote("");
      props.onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} class="flex flex-col gap-2 w-full max-w-xs">
      <textarea
        value={note()}
        onInput={(e) => setNote(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder="What's happening? (optional)"
        class="border border-gray-700 bg-gray-900 text-gray-200 rounded px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-500"
      />
      <button
        type="submit"
        disabled={saving()}
        class="bg-pink-500 text-white rounded px-4 py-2 text-sm font-medium hover:bg-pink-600 disabled:opacity-50 transition-colors"
      >
        {saving() ? "Saving..." : "Log"}
      </button>
    </form>
  );
};

export default EntryForm;
