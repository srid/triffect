import type { TriplitClient } from "@triplit/client";
import type { schema } from "../../triplit/schema";

type Client = TriplitClient<typeof schema>;

interface ExportEnvelope {
  version: 1;
  exportedAt: string;
  entries: {
    id: string;
    good: number;
    bad: number;
    naivete: number;
    note: string | null;
    created_at: string;
  }[];
}

export async function exportEntries(client: Client): Promise<void> {
  const all = await client.fetch(client.query("entries"));
  const entries = [...all.values()].map((e) => ({
    id: e.id,
    good: e.good,
    bad: e.bad,
    naivete: e.naivete,
    note: e.note ?? null,
    created_at: new Date(e.created_at).toISOString(),
  }));

  const envelope: ExportEnvelope = {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
  };

  const json = JSON.stringify(envelope, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `triffect-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importEntries(
  client: Client,
  file: File,
): Promise<{ imported: number; skipped: number }> {
  const text = await file.text();
  const data = JSON.parse(text) as ExportEnvelope;

  if (!data.version || !Array.isArray(data.entries)) {
    throw new Error("Invalid export file format");
  }

  const existing = await client.fetch(client.query("entries"));
  const existingIds = new Set([...existing.values()].map((e) => e.id));

  let imported = 0;
  let skipped = 0;

  for (const entry of data.entries) {
    if (existingIds.has(entry.id)) {
      skipped++;
      continue;
    }
    await client.insert("entries", {
      id: entry.id,
      good: entry.good,
      bad: entry.bad,
      naivete: entry.naivete,
      ...(entry.note != null ? { note: entry.note } : {}),
      created_at: new Date(entry.created_at),
    });
    imported++;
  }

  return { imported, skipped };
}
