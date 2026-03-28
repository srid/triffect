import { When, Then } from "@cucumber/cucumber";
import { TriggityWorld } from "../support/world.ts";

When("I tap the center of the triangle", async function (this: TriggityWorld) {
  await this.clickTriangle(0.5, 0.5);
});

When("I submit the entry", async function (this: TriggityWorld) {
  await this.page.locator('button[type="submit"]').click();
  // Wait for the form to process
  await this.page.waitForTimeout(500);
});

When(
  "I type {string} in the note field",
  async function (this: TriggityWorld, text: string) {
    await this.page.locator("input[type='text']").fill(text);
  },
);

Then("a selection marker should appear", async function (this: TriggityWorld) {
  const marker = this.page.locator("svg circle[r='12'][fill='white']");
  await marker.waitFor({ state: "visible", timeout: 3000 });
});

Then("the entry form should be visible", async function (this: TriggityWorld) {
  const form = this.page.locator("form");
  await form.waitFor({ state: "visible", timeout: 3000 });
});

Then(
  "the entry form should not be visible",
  async function (this: TriggityWorld) {
    const form = this.page.locator("form");
    await form.waitFor({ state: "hidden", timeout: 3000 });
  },
);

Then(
  "the entry should appear in the list",
  async function (this: TriggityWorld) {
    const entry = this.page.locator("ul li").first();
    await entry.waitFor({ state: "visible", timeout: 5000 });
  },
);

Then(
  "the entry should show {string}",
  async function (this: TriggityWorld, text: string) {
    const entry = this.page.locator("ul li", { hasText: text });
    await entry.waitFor({ state: "visible", timeout: 5000 });
  },
);
