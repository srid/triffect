import { When, Then } from "@cucumber/cucumber";
import assert from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { TriggityWorld } from "../support/world.ts";

let downloadedJson: any;
let importFilePath: string;
let importedIds: string[];

function makeEntries(count: number) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `test-import-${now}-${i}`,
    good: 0.33,
    bad: 0.33,
    naivete: 0.34,

    created_at: new Date(now - i * 60_000).toISOString(),
  }));
}

function writeImportFile(entries: any[]): string {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
  };
  const filePath = path.join(
    os.tmpdir(),
    `triffect-test-import-${Date.now()}.json`,
  );
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return filePath;
}

When(
  "I click {string}",
  async function (this: TriggityWorld, buttonText: string) {
    const btn = this.page.locator(`button`, { hasText: buttonText });
    await btn.waitFor({ state: "visible", timeout: 5000 });

    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      btn.click(),
    ]);

    const downloadPath = await download.path();
    if (downloadPath) {
      const content = fs.readFileSync(downloadPath, "utf-8");
      downloadedJson = JSON.parse(content);
    }
  },
);

Then(
  "the downloaded JSON should have version {int} and at least {int} entry",
  async function (this: TriggityWorld, version: number, minEntries: number) {
    assert.ok(downloadedJson, "No JSON was downloaded");
    assert.strictEqual(downloadedJson.version, version);
    assert.ok(
      Array.isArray(downloadedJson.entries),
      "entries should be an array",
    );
    assert.ok(
      downloadedJson.entries.length >= minEntries,
      `Expected at least ${minEntries} entry, got ${downloadedJson.entries.length}`,
    );
    assert.ok(downloadedJson.exportedAt, "exportedAt should be present");
    const entry = downloadedJson.entries[0];
    assert.ok(entry.id, "entry should have id");
    assert.ok(typeof entry.good === "number", "entry should have good");
    assert.ok(typeof entry.bad === "number", "entry should have bad");
    assert.ok(typeof entry.naivete === "number", "entry should have naivete");
    assert.ok(entry.created_at, "entry should have created_at");
  },
);

async function triggerImport(world: TriggityWorld, filePath: string) {
  world.page.once("dialog", (dialog) => dialog.accept());
  const [fileChooser] = await Promise.all([
    world.page.waitForEvent("filechooser"),
    world.page.locator("button", { hasText: "Import data" }).click(),
  ]);
  await fileChooser.setFiles(filePath);
  await world.page.waitForTimeout(1000);
}

When(
  "I import a JSON file with {int} entries",
  async function (this: TriggityWorld, count: number) {
    const entries = makeEntries(count);
    importedIds = entries.map((e) => e.id);
    importFilePath = writeImportFile(entries);
    await triggerImport(this, importFilePath);
  },
);

When("I import the same JSON file again", async function (this: TriggityWorld) {
  await triggerImport(this, importFilePath);
});

Then(
  "the downloaded JSON should contain the {int} imported entries",
  async function (this: TriggityWorld, expected: number) {
    assert.ok(downloadedJson, "No JSON was downloaded");
    assert.ok(
      Array.isArray(downloadedJson.entries),
      "entries should be an array",
    );
    const found = downloadedJson.entries.filter((e: any) =>
      importedIds.includes(e.id),
    );
    assert.strictEqual(
      found.length,
      expected,
      `Expected ${expected} imported entries in export, found ${found.length} (total entries: ${downloadedJson.entries.length})`,
    );
  },
);
