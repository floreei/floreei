import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("buquê: produzir N ao cadastrar baixa N× a ficha técnica do estoque", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `producao_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Produção");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  // Produto com custo por unidade-base
  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cat = await page.request.post(`${API}/categories`, {
    headers: auth,
    data: { name: "Produtos" },
  });
  const pid = await (
    await page.request.post(`${API}/products`, {
      headers: auth,
      data: {
        name: "Hortênsia Prod",
        categoryId: (await cat.json()).id,
        unit: "HASTE",
        currentUnitCost: 3,
      },
    })
  ).json();

  // Novo buquê com produção de 10
  await page.goto("/buques");
  await page.getByRole("button", { name: "Novo buquê" }).first().click();
  await page.getByLabel("Nome").fill("Buquê Produção");
  await page.getByTestId("arrangement-item-product").first().click();
  await page.getByRole("option", { name: /Hortênsia Prod/ }).click();
  await page.getByLabel(/Produzir agora/).fill("10");
  await page.getByRole("button", { name: "Criar buquê" }).click();
  await expect(page.getByText(/produzido/)).toBeVisible();

  // Estoque baixou 10 hastes (1 por buquê × 10)
  const stock = await (
    await page.request.get(`${API}/stock/overview`, { headers: auth })
  ).json();
  const level = stock.levels.find((l: { productId: string }) => l.productId === pid.id);
  expect(level.onHand).toBe(-10);
});
