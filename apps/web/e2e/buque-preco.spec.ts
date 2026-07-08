import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("buquê: precifica por margem % com preço derivado ao vivo", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `preco_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Preço");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  // Insumo com custo 60
  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cat = await page.request.post(`${API}/categories`, {
    headers: auth,
    data: { name: "Rosas" },
  });
  await page.request.post(`${API}/products`, {
    headers: auth,
    data: {
      name: "Rosa Especial",
      categoryId: (await cat.json()).id,
      unit: "UNIDADE",
      currentUnitCost: 60,
    },
  });

  // Novo buquê: margem 40% sobre o custo 60 → preço R$ 100,00 ao vivo
  await page.goto("/buques");
  await page.getByRole("button", { name: "Novo buquê" }).click();
  await page.getByLabel("Nome").fill("Buquê Margem");
  await page.getByTestId("arrangement-item-product").first().click();
  await page.getByRole("option", { name: /Rosa Especial/ }).click();
  await page.getByRole("button", { name: "Margem (%)" }).click();
  await page.locator("#a-margin").fill("40");

  await expect(page.getByTestId("arrangement-price")).toContainText("R$ 100,00");
  await expect(page.getByTestId("arrangement-cost")).toContainText("R$ 60,00");

  await page.getByRole("button", { name: "Criar buquê" }).click();
  await expect(page.getByText(/Buquê criado/)).toBeVisible();

  // Backend: preço derivado gravado + política
  const list = await (
    await page.request.get(`${API}/arrangements`, { headers: auth })
  ).json();
  const buque = list.data.find((a: { name: string }) => a.name === "Buquê Margem");
  expect(buque.salePrice).toBe(100);
  expect(buque.pricingMode).toBe("MARGIN_PCT");
  expect(buque.profitPct).toBe(40);
});
