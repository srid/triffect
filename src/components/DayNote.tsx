import { type Component, createSignal, createEffect, Show } from "solid-js";
import { client } from "../lib/triplit";

interface Props {
  dayKey: string;
}

const DayNote: Component<Props> = (props) => {
  const [editing, setEditing] = createSignal(false);
  const [draft, setDraft] = createSignal("");
  const [savedNote, setSavedNote] = createSignal("");
  const [error, setError] = createSignal("");

  async function fetchNote(key: string) {
    try {
      const r = await client.fetchById("day_notes", key);
      const note = r?.note ?? "";
      setSavedNote(note);
      setDraft(note);
    } catch {
      setSavedNote("");
      setDraft("");
    }
  }

  // Fetch note when dayKey changes
  createEffect(() => {
    const key = props.dayKey;
    setEditing(false);
    setError("");
    fetchNote(key);
  });

  async function save() {
    setError("");
    try {
      const text = draft().trim();
      const hadNote = savedNote().length > 0;

      if (text.length === 0 && hadNote) {
        await client.delete("day_notes", props.dayKey);
      } else if (text.length > 0 && hadNote) {
        await client.update("day_notes", props.dayKey, (n) => {
          n.note = text;
        });
      } else if (text.length > 0) {
        await client.insert("day_notes", { id: props.dayKey, note: text });
      }
      // Re-fetch to confirm persistence
      await fetchNote(props.dayKey);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div class="w-full max-w-xs px-1">
      <Show when={error()}>
        <p class="text-[10px] text-red-400 mb-1">{error()}</p>
      </Show>
      <Show
        when={editing()}
        fallback={
          <div
            class="min-h-[28px] px-2 py-1.5 rounded bg-gray-900 cursor-pointer text-xs"
            classList={{
              "text-gray-500 italic": !savedNote(),
              "text-gray-300": !!savedNote(),
            }}
            onClick={() => {
              setDraft(savedNote());
              setEditing(true);
            }}
          >
            {savedNote() || "tap to add note..."}
          </div>
        }
      >
        <textarea
          class="w-full px-2 py-1.5 rounded bg-gray-900 text-gray-200 text-xs border border-gray-700 focus:border-gray-500 outline-none resize-none"
          rows={3}
          value={draft()}
          onInput={(e) => setDraft(e.currentTarget.value)}
          ref={(el) => setTimeout(() => el.focus(), 0)}
        />
        <button
          class="mt-1 px-3 py-1 rounded bg-gray-800 text-gray-300 text-xs active:bg-gray-700"
          onClick={() => save()}
        >
          Done
        </button>
      </Show>
    </div>
  );
};

export default DayNote;
