import { Component, For, Show } from "solid-js";
import { useQuery } from "@triplit/solid";
import { client } from "../lib/triplit";
import { barycentricToColor, type Barycentric } from "../lib/coords";

const EntryList: Component = () => {
  const query = client.query("entries").Order("created_at", "DESC").Limit(50);
  const { results, fetchingLocal } = useQuery(client, query);

  return (
    <div class="w-full max-w-xs">
      <h2 class="text-sm font-medium text-gray-400 mb-2">Recent</h2>
      <Show
        when={!fetchingLocal()}
        fallback={<p class="text-xs text-gray-400">Loading...</p>}
      >
        <Show
          when={results() && [...(results()?.values() ?? [])].length > 0}
          fallback={<p class="text-xs text-gray-400">No entries yet</p>}
        >
          <ul class="flex flex-col gap-1">
            <For each={[...(results()?.values() ?? [])]}>
              {(entry) => {
                const b: Barycentric = {
                  good: entry.good,
                  bad: entry.bad,
                  naivete: entry.naivete,
                };
                const color = barycentricToColor(b);
                return (
                  <li class="flex items-center gap-2 py-1.5 px-2 rounded bg-gray-900">
                    <span
                      class="w-3 h-3 rounded-full shrink-0"
                      style={{ "background-color": color }}
                    />
                    <span class="text-xs text-gray-500">
                      {new Date(entry.created_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Show when={entry.note}>
                      <span class="text-xs text-gray-300 truncate">
                        {entry.note}
                      </span>
                    </Show>
                  </li>
                );
              }}
            </For>
          </ul>
        </Show>
      </Show>
    </div>
  );
};

export default EntryList;
