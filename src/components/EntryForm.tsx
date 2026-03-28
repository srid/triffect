import { type Component, createSignal } from "solid-js";
import { ulid } from "ulid";
import { client } from "../lib/triplit";
import type { Barycentric } from "../lib/coords";

interface Props {
  coords: Barycentric;
  onSaved: () => void;
}

const EntryForm: Component<Props> = (props) => {
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
        created_at: new Date(),
      });
      props.onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      class="flex flex-col gap-2 w-full max-w-xs px-1"
    >
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
