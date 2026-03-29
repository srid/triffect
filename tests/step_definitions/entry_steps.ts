import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert";
import { TriggityWorld } from "../support/world.ts";

When("I tap the center of the triangle", async function (this: TriggityWorld) {
  await this.clickTriangle(0.5, 0.5);
  // Wait for entry to be saved
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
  // Re-create context with touch support enabled
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
    await this.touchTriangle(0.5, 0.5);
    // Wait for entry to be saved
    await this.page.waitForTimeout(1000);
  },
);

Then(
  "exactly {int} entry should exist",
  async function (this: TriggityWorld, expected: number) {
    const dots = await this.trailDotCount();
    assert.strictEqual(
      dots,
      expected,
      `Expected ${expected} entry, got ${dots}`,
    );
  },
);
