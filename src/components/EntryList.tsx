import { Component, For, Show } from "solid-js";
import { useQuery } from "@triplit/solid";
import { client } from "../lib/triplit";
import { barycentricToColor, type Barycentric } from "../lib/coords";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const EntryList: Component = () => {
  const query = client
    .query("entries")
    .Where("created_at", ">=", startOfToday())
    .Order("created_at", "DESC");
  const { results, fetchingLocal } = useQuery(client, query);

  const entries = () => [...(results()?.values() ?? [])];

  return (
    <div class="w-full max-w-xs px-1">
      <h2 class="text-sm font-medium text-gray-400 mb-1">Today</h2>
      <Show
        when={!fetchingLocal()}
        fallback={<p class="text-xs text-gray-500">Loading...</p>}
      >
        <Show
          when={entries().length > 0}
          fallback={<p class="text-xs text-gray-500">No entries yet today</p>}
        >
          <ul class="flex flex-col gap-1">
            <For each={entries()}>
              {(entry) => {
                const b: Barycentric = {
                  good: entry.good,
                  bad: entry.bad,
                  naivete: entry.naivete,
                };
                const color = barycentricToColor(b);
                return (
                  <li class="flex items-center gap-2 py-1 px-2 rounded bg-gray-900">
                    <span
                      class="w-3 h-3 rounded-full shrink-0"
                      style={{ "background-color": color }}
                    />
                    <span class="text-xs text-gray-500">
                      {new Date(entry.created_at).toLocaleTimeString(
                        undefined,
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
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
