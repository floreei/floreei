import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("estoque: ajusta o saldo de uma flor manualmente pela contagem", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `estoque_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Estoque");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cat = await page.request.post(`${API}/categories`, {
    headers: auth,
    data: { name: "Rosas" },
  });
  const pid = await (
    await page.request.post(`${API}/products`, {
      headers: auth,
      data: {
        name: "Rosa Estoque",
        categoryId: (await cat.json()).id,
        unit: "UNIDADE",
        defaultPurchasePrice: 4,
        defaultSalePrice: 10,
      },
    })
  ).json();

  // Estoque: a flor aparece com saldo 0
  await page.goto("/estoque");
  const row = page.getByRole("row", { name: /Rosa Estoque/ });
  await expect(row).toContainText("0 unidade");

  // Ajusta o saldo para 25 (contagem física)
  await row.getByRole("button", { name: "Ajustar" }).click();
  await expect(page.getByRole("heading", { name: /Ajustar saldo/ })).toBeVisible();
  await expect(page.getByText("Saldo atual:")).toContainText("0 unidade");
  await page.getByLabel(/Novo saldo/).fill("25");
  await page.getByRole("button", { name: "Salvar saldo" }).click();
  await expect(page.getByText("Saldo atualizado.")).toBeVisible();
  await expect(page.getByRole("row", { name: /Rosa Estoque/ })).toContainText(
    "25 unidade",
  );

  // Backend confirma
  const stock = await (
    await page.request.get(`${API}/stock/overview`, { headers: auth })
  ).json();
  const level = stock.levels.find((l: { productId: string }) => l.productId === pid.id);
  expect(level.onHand).toBe(25);
});
