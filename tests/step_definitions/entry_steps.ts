import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert";
import { TriggityWorld } from "../support/world.ts";

let dotsBefore = 0;

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
    dotsBefore = await this.trailDotCount();
    await this.touchTriangle(0.5, 0.5);
    await this.page.waitForTimeout(1000);
  },
);

Then(
  "exactly {int} new trail dot should appear",
  async function (this: TriggityWorld, expected: number) {
    const dotsAfter = await this.trailDotCount();
    const added = dotsAfter - dotsBefore;

    // Count actual entry circles (r="5") and all circles for debugging
    const allCircles = await this.page.locator("svg circle").count();
    const r5Circles = await this.page.locator('svg circle[r="5"]').count();
    const r6Circles = await this.page.locator('svg circle[r="6"]').count();
    const r8Circles = await this.page.locator('svg circle[r="8"]').count();
    const r12Circles = await this.page.locator('svg circle[r="12"]').count();

    assert.strictEqual(
      added,
      expected,
      `Expected ${expected} new dot, got ${added} (before=${dotsBefore}, after=${dotsAfter}, circles: r5=${r5Circles} r6=${r6Circles} r8=${r8Circles} r12=${r12Circles} total=${allCircles})`,
    );
  },
);
