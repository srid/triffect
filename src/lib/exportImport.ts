import type { TriplitClient } from "@triplit/client";
import type { schema } from "../../triplit/schema";

type Client = TriplitClient<typeof schema>;

interface ExportEnvelope {
  version: number;
  exportedAt: string;
  entries: {
    id: string;
    good: number;
    bad: number;
    naivete: number;
    created_at: string;
  }[];
}

function downloadJson(json: string, filename: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportEntries(client: Client): Promise<void> {
  const all = await client.fetch(client.query("entries"));
  const entries = [...all.values()].map(
    ({ id, good, bad, naivete, created_at }) => ({
      id,
      good,
      bad,
      naivete,
      created_at: new Date(created_at).toISOString(),
    }),
  );

  const envelope: ExportEnvelope = {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
  };

  const date = new Date().toISOString().slice(0, 10);
  downloadJson(JSON.stringify(envelope, null, 2), `triffect-${date}.json`);
}

export async function importEntries(
  client: Client,
  file: File,
): Promise<{ imported: number; skipped: number }> {
  const data = JSON.parse(await file.text()) as ExportEnvelope;

  if (!data.version || !Array.isArray(data.entries)) {
    throw new Error("Invalid export file format");
  }

  const existing = await client.fetch(client.query("entries"));
  const existingIds = new Set([...existing.values()].map((e) => e.id));

  let imported = 0;
  let skipped = 0;

  for (const { id, good, bad, naivete, created_at } of data.entries) {
    if (existingIds.has(id)) {
      skipped++;
      continue;
    }
    await client.insert("entries", {
      id,
      good,
      bad,
      naivete,
      created_at: new Date(created_at),
    });
    imported++;
  }

  return { imported, skipped };
}

/** Prompt user to pick a JSON file and import it. Returns null if cancelled. */
export async function promptImport(
  client: Client,
): Promise<{ imported: number; skipped: number } | null> {
  const file = await pickFile(".json");
  return file ? importEntries(client, file) : null;
}

function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}
