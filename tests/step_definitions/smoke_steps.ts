import { Given, Then } from "@cucumber/cucumber";
import { expect } from "@cucumber/cucumber";
import { TriggityWorld } from "../support/world.ts";

Given("I open the app", async function (this: TriggityWorld) {
  await this.page.goto("/");
  await this.page.waitForLoadState("networkidle");
});

Then(
  "the page title should be {string}",
  async function (this: TriggityWorld, title: string) {
    const actual = await this.page.title();
    if (actual !== title) {
      throw new Error(`Expected title "${title}" but got "${actual}"`);
    }
  },
);

Then("the triangle should be visible", async function (this: TriggityWorld) {
  const svg = this.page.locator("div.cursor-crosshair");
  await svg.waitFor({ state: "visible", timeout: 5000 });
});

Then("there should be no console errors", async function (this: TriggityWorld) {
  if (this.errors.length > 0) {
    throw new Error(`Console errors: ${this.errors.join(", ")}`);
  }
});
