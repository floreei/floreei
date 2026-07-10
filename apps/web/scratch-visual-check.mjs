import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3200", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.screenshot({ path: "/tmp/check1.png" });

const count = await page.getByText("Vendas do mês", { exact: true }).count();
console.log("match count:", count);
await browser.close();
