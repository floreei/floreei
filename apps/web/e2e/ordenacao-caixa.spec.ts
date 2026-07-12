import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("ordenação nas tabelas + caixa com cliente/título novo", async ({ page }) => {
  const stamp = Date.now();
  const email = `ord_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Ord");
  await page.getByLabel("Seu nome").fill("Dona");
  await page.getByLabel("CNPJ ou CPF").fill(String(stamp).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cust = await (
    await page.request.post(`${API}/customers`, { headers: auth, data: { name: "Ana" } })
  ).json();
  // 3 vendas diretas com valores distintos; a de 250 é do cliente e paga.
  for (const amount of [100, 300]) {
    await page.request.post(`${API}/events/quick`, { headers: auth, data: { amount } });
  }
  const paid = await (
    await page.request.post(`${API}/events/quick`, {
      headers: auth,
      data: { amount: 250, customerId: cust.id },
    })
  ).json();
  await page.request.post(`${API}/finance/events/${paid.id}/payments`, {
    headers: auth,
    data: { amount: 250, method: "PIX" },
  });

  // --- Vendas: título novo + ordenação por "Vendido" ---
  await page.goto("/vendas");
  await expect(page.locator("table").getByText("Venda direta").first()).toBeVisible();
  await page.getByRole("button", { name: "Vendido" }).click(); // asc
  await expect(page.locator("table tbody tr").first()).toContainText("R$ 100,00");
  await page.getByRole("button", { name: "Vendido" }).click(); // desc
  await expect(page.locator("table tbody tr").first()).toContainText("R$ 300,00");

  // --- Caixa: cliente ao lado + filtro por valor ---
  await page.goto("/caixa");
  await expect(page.getByText("Ana", { exact: false }).first()).toBeVisible();
  await page.getByPlaceholder("Buscar por cliente ou descrição…").fill("Ana");
  await expect(page.getByText("Ana", { exact: false }).first()).toBeVisible();
});
