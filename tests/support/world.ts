/**
 * Cucumber World — holds Playwright page + Triggity-specific helpers.
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

  /** Click inside the triangle at a relative position (0-1 for x and y within the SVG). */
  async clickTriangle(relX: number, relY: number) {
    const svg = this.page.locator("svg.cursor-crosshair");
    const box = await svg.boundingBox();
    if (!box) throw new Error("Triangle SVG not found");
    await svg.click({
      position: { x: box.width * relX, y: box.height * relY },
    });
  }

  /** Get the count of entries in the list. */
  async entryCount(): Promise<number> {
    return this.page.locator("ul li").count();
  }
}

setWorldConstructor(TriggityWorld);
