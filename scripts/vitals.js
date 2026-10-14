#!/usr/bin/env node
"use strict";

// Measures First Contentful Paint and Cumulative Layout Shift on the local build, throttled
// like Lighthouse's mobile run (4x slower CPU, slow 4G), so changes can be checked before
// they reach production. Each page loads cold RUNS times and the median counts.
//
// Run: npm run vitals                          (builds first, checks /)
//      npm run vitals -- / /posts/vim-statusline
//      npm run vitals -- --desktop             (desktop viewport, no throttling)
//
// Exits 1 when a median misses Google's "good" bar: FCP under 1.8s, CLS under 0.1.

const { chromium } = require("@playwright/test");
const { createServer } = require("./serve");

const RUNS = 5;
const GOOD = { fcp: 1800, cls: 0.1 };

const args = process.argv.slice(2);
const desktop = args.includes("--desktop");
const pages = args.filter((a) => !a.startsWith("--"));
if (!pages.length) pages.push("/");

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

// Runs in the page before its own scripts, so no paint or shift is missed
function observe() {
  window.__vitals = { fcp: null, cls: 0 };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries())
      if (e.name === "first-contentful-paint") window.__vitals.fcp = e.startTime;
  }).observe({ type: "paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value;
  }).observe({ type: "layout-shift", buffered: true });
}

async function measure(browser, url) {
  // A new context per load, so nothing is cached
  const context = await browser.newContext(
    desktop
      ? { viewport: { width: 1350, height: 940 } }
      : {
          viewport: { width: 412, height: 823 },
          deviceScaleFactor: 1.75,
          isMobile: true,
          hasTouch: true,
        },
  );
  const page = await context.newPage();
  if (!desktop) {
    // Lighthouse's mobile throttling values
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 562.5,
      downloadThroughput: (1474.56 * 1024) / 8,
      uploadThroughput: (675 * 1024) / 8,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }
  await page.addInitScript(observe);
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(1000); // Late shifts, from fonts or images, count too
  const vitals = await page.evaluate(() => window.__vitals);
  await context.close();
  return vitals;
}

async function main() {
  const server = createServer().listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  let failed = false;

  console.log(
    `${desktop ? "Desktop, no throttling" : "Mobile, 4x CPU and slow 4G"}, median of ${RUNS} cold loads\n`,
  );
  try {
    for (const p of pages) {
      const runs = [];
      for (let i = 0; i < RUNS; i++) runs.push(await measure(browser, base + p));
      const fcp = median(runs.map((r) => r.fcp ?? Infinity));
      const cls = median(runs.map((r) => r.cls));
      const ok = fcp < GOOD.fcp && cls < GOOD.cls;
      if (!ok) failed = true;
      console.log(
        `${ok ? "pass" : "FAIL"}  ${p}  FCP ${Math.round(fcp)} ms  CLS ${cls.toFixed(3)}`,
      );
    }
  } finally {
    await browser.close();
    server.close();
  }
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
