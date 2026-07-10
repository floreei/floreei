import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3200", { waitUntil: "networkidle" });
await page.waitForTimeout(2000); // let everything settle once

// Now reload to re-trigger the entrance animation with everything already cached/hydrated
await page.reload({ waitUntil: "domcontentloaded" });

const results = [];
const start = Date.now();
while (Date.now() - start < 900) {
  const box = await page.getByText("Vendas do mês", { exact: true }).boundingBox().catch(() => null);
  results.push({ ms: Date.now() - start, y: box?.y?.toFixed(1), h: box?.height?.toFixed(1) });
  await page.waitForTimeout(20);
}
console.log(results.map(r => `${r.ms}ms y=${r.y} h=${r.h}`).join("\n"));
await browser.close();
