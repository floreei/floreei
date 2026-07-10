import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3200", { waitUntil: "networkidle" });

const sections = [
  ["cta-final", "text=Vamos organizar a sua floricultura juntos?"],
];

for (const [name, selector] of sections) {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const section = page.locator("section", { has: el }).first();
  await section.screenshot({ path: `/tmp/shot-${name}.png` }).catch(async () => {
    await page.screenshot({ path: `/tmp/shot-${name}.png` });
  });
}

await browser.close();
console.log("done");
