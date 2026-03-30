import { type Component, createSignal, createEffect, Show } from "solid-js";
import { client } from "../lib/triplit";

interface Props {
  dayKey: string;
}

const DayNote: Component<Props> = (props) => {
  const [editing, setEditing] = createSignal(false);
  const [draft, setDraft] = createSignal("");
  const [savedNote, setSavedNote] = createSignal("");

  // Fetch note reactively when dayKey changes
  createEffect(() => {
    const key = props.dayKey;
    setEditing(false);
    client
      .fetchById("day_notes", key)
      .then((r) => {
        const note = r?.note ?? "";
        setSavedNote(note);
        setDraft(note);
      })
      .catch(() => {
        setSavedNote("");
        setDraft("");
      });
  });

  // Also subscribe to live updates
  createEffect(() => {
    const key = props.dayKey;
    const unsub = client.subscribe(
      client.query("day_notes").Where("id", "=", key),
      (results: unknown) => {
        let note = "";
        if (results instanceof Map) {
          note = results.get(key)?.note ?? "";
        } else if (Array.isArray(results)) {
          note =
            (results as { id: string; note: string }[]).find(
              (r) => r.id === key,
            )?.note ?? "";
        }
        setSavedNote(note);
        if (!editing()) setDraft(note);
      },
    );
    return unsub;
  });

  let saving = false;
  async function save() {
    if (saving) return;
    saving = true;
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
      setEditing(false);
    } finally {
      saving = false;
    }
  }

  return (
    <div class="w-full max-w-xs px-1">
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
          onBlur={() => save()}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              save();
            }
          }}
          ref={(el) => setTimeout(() => el.focus(), 0)}
        />
      </Show>
    </div>
  );
};

export default DayNote;
