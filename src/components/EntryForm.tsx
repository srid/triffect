import { type Component, createSignal } from "solid-js";
import { ulid } from "ulid";
import { client } from "../lib/triplit";
import { barycentricToColor, type Barycentric } from "../lib/coords";

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
        class="text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors"
        style={{ "background-color": barycentricToColor(props.coords) }}
      >
        {saving() ? "Saving..." : "Log"}
      </button>
    </form>
  );
};

export default EntryForm;
