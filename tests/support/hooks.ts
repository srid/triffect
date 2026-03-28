/**
 * Cucumber hooks — browser lifecycle + server provisioning.
 *
 * TRIFFECT_SERVER controls how the app is provided:
 *  - URL (http://...) → reuse an existing server
 *  - file path        → each worker spawns the binary on a random port
 *
 * Random ports (via get-port) let parallel runs across worktrees
 * coexist without port collisions.
 */

import { Before, After, BeforeAll, AfterAll, Status } from "@cucumber/cucumber";
import { chromium } from "playwright";
import type { Browser } from "playwright";
import getPort from "get-port";
import { TriggityWorld } from "./world.ts";
import * as fs from "node:fs";
import * as path from "node:path";
import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";

const workerId = parseInt(process.env.CUCUMBER_WORKER_ID || "0");

let baseUrl: string;
let browser: Browser;
let serverProcess: ChildProcess | undefined;

function killServer() {
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
    serverProcess = undefined;
  }
}
process.on("exit", killServer);

const ciArgs = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--headless=new",
];

async function waitForHealth(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await fetch(url);
      if (resp.ok) return;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(
    `App did not become available at ${url} within ${timeoutMs}ms`,
  );
}

BeforeAll(async function () {
  const triffectServer = process.env.TRIFFECT_SERVER;
  if (!triffectServer)
    throw new Error("TRIFFECT_SERVER must be a URL or binary path");

  if (triffectServer.startsWith("http")) {
    baseUrl = triffectServer;
  } else {
    const port = await getPort();
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`[worker:${workerId}] Starting server on port ${port}...`);
    serverProcess = spawn(triffectServer, [], {
      stdio: "pipe",
      env: {
        ...process.env,
        TRIFFECT_HOST: "127.0.0.1",
        TRIFFECT_PORT: String(port),
      },
    });
    serverProcess.stderr?.on("data", (data: Buffer) => {
      process.stderr.write(`[server:${workerId}] ${data}`);
    });
  }

  await waitForHealth(baseUrl, 30_000);
  console.log(`[worker:${workerId}] App is healthy at ${baseUrl}`);

  const isCI = !!process.env.CI;
  browser = await chromium.launch({
    headless: process.env.HEADLESS !== "false",
    args: isCI ? ciArgs : [],
  });
});

AfterAll(async function () {
  if (browser) await browser.close();
  killServer();
});

Before(async function (this: TriggityWorld) {
  this.browser = browser;
  this.context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    baseURL: baseUrl,
    ignoreHTTPSErrors: true,
  });
  this.page = await this.context.newPage();
  this.errors = [];
  this.page.on("pageerror", (err) => this.errors.push(err.message));
});

After(async function (this: TriggityWorld, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    const dir = path.resolve(
      import.meta.dirname,
      "..",
      "reports",
      "screenshots",
    );
    fs.mkdirSync(dir, { recursive: true });
    const name = scenario.pickle.name.replace(/\s+/g, "-").toLowerCase();
    await this.page.screenshot({
      path: path.join(dir, `${name}.png`),
      fullPage: true,
    });
  }
  if (this.context) await this.context.close();
});
