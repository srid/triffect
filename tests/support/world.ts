/**
 * Cucumber World — holds Playwright page + Triffect-specific helpers.
 * One instance per scenario. Browser context created in hooks.ts.
 */

import {
  World,
  setWorldConstructor,
  setDefaultTimeout,
} from "@cucumber/cucumber";
import type { Browser, BrowserContext, Page } from "playwright";

setDefaultTimeout(60_000);

export class TriggityWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  errors: string[] = [];

  /** Click inside the triangle at a relative position (0-1 for x and y within the container). */
  async clickTriangle(relX: number, relY: number) {
    const el = this.page.locator("div.cursor-crosshair");
    const box = await el.boundingBox();
    if (!box) throw new Error("Triangle not found");
    await el.click({
      position: { x: box.width * relX, y: box.height * relY },
    });
  }

  /** Touch inside the triangle (simulates mobile touchstart). */
  async touchTriangle(relX: number, relY: number) {
    const el = this.page.locator("div.cursor-crosshair");
    const box = await el.boundingBox();
    if (!box) throw new Error("Triangle not found");
    await el.tap({
      position: { x: box.width * relX, y: box.height * relY },
    });
  }

  /** Count trail dots on the triangle SVG. */
  async trailDotCount(): Promise<number> {
    // Trail dots are circles with r="5" and a fill color (not white, not animation rings)
    return this.page.locator('svg circle[r="5"]').count();
  }

  /** Count entries via IndexedDB. */
  async entryCount(): Promise<number> {
    return this.page.evaluate(async () => {
      // Query Triplit for today's entries
      const dbs = await indexedDB.databases();
      const triplitDb = dbs.find((d) => d.name?.includes("triplit"));
      if (!triplitDb?.name) return 0;
      return new Promise<number>((resolve) => {
        const req = indexedDB.open(triplitDb.name!);
        req.onsuccess = () => {
          const db = req.result;
          const stores = Array.from(db.objectStoreNames);
          // Count entries in any store that has entry-like data
          let total = 0;
          if (stores.length === 0) {
            resolve(0);
            return;
          }
          const tx = db.transaction(stores, "readonly");
          let pending = stores.length;
          for (const store of stores) {
            const countReq = tx.objectStore(store).count();
            countReq.onsuccess = () => {
              total += countReq.result;
              if (--pending === 0) resolve(total);
            };
          }
        };
        req.onerror = () => resolve(0);
      });
    });
  }
}

setWorldConstructor(TriggityWorld);
