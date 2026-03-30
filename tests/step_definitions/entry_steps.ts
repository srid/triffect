import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert";
import { TriggityWorld } from "../support/world.ts";

When("I tap the center of the triangle", async function (this: TriggityWorld) {
  await this.clickTriangle(0.5, 0.5);
  await this.page.waitForTimeout(500);
});

Then(
  "a trail dot should appear on the triangle",
  async function (this: TriggityWorld) {
    const count = await this.trailDotCount();
    assert.ok(count > 0, `Expected trail dots, got ${count}`);
  },
);

Given("I open the app on mobile", async function (this: TriggityWorld) {
  const oldContext = this.context;
  this.context = await this.browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    baseURL: (oldContext as any)._options?.baseURL ?? "http://localhost:5173",
    ignoreHTTPSErrors: true,
  });
  this.page = await this.context.newPage();
  this.errors = [];
  this.page.on("pageerror", (err) => this.errors.push(err.message));
  await oldContext.close();
  await this.page.goto("/");
  await this.page.waitForLoadState("networkidle");
});

When(
  "I touch the center of the triangle",
  async function (this: TriggityWorld) {
    // Capture console logs to trace click handler invocations
    const logs: string[] = [];
    this.page.on("console", (msg) => logs.push(msg.text()));

    // Inject a click counter on the canvas before touching
    await this.page.evaluate(() => {
      const canvas = document.querySelector(
        "div.cursor-crosshair canvas",
      ) as HTMLElement;
      let clickCount = 0;
      canvas.addEventListener(
        "click",
        (e) => {
          clickCount++;
          console.log(
            `[test] canvas click #${clickCount}: clientX=${e.clientX} clientY=${e.clientY} target=${(e.target as Element)?.tagName}`,
          );
        },
        true,
      );
    });

    await this.touchTriangle(0.5, 0.5);
    await this.page.waitForTimeout(1000);

    // Store logs for assertion step
    (this as any)._clickLogs = logs;
  },
);

Then(
  "exactly {int} new trail dot should appear",
  async function (this: TriggityWorld, expected: number) {
    const dots = await this.trailDotCount();
    const logs = ((this as any)._clickLogs as string[]) ?? [];
    const clickLogs = logs.filter((l) => l.includes("[test] canvas click"));
    assert.strictEqual(
      dots,
      expected,
      `Expected ${expected} trail dot, got ${dots} (click events: ${clickLogs.length}, logs: ${clickLogs.join(" | ")})`,
    );
  },
);
