import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("compra: mostra o custo por unidade ao comprar uma caixa", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `compra_cu_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Compra");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  // Vinho: 1 caixa = 20 unidades, preço da caixa R$ 600 → custo por unidade R$ 30
  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cat = await page.request.post(`${API}/categories`, {
    headers: auth,
    data: { name: "Vinhos" },
  });
  await page.request.post(`${API}/products`, {
    headers: auth,
    data: {
      name: "Vinho Tinto",
      categoryId: (await cat.json()).id,
      unit: "UNIDADE",
      purchaseUnit: "CAIXA",
      packSize: 20,
      defaultPurchasePrice: 600,
    },
  });
  await page.request.post(`${API}/suppliers`, {
    headers: auth,
    data: { name: "Adega Central" },
  });

  // Nova compra → escolhe fornecedor e o vinho
  await page.goto("/compras");
  await page.getByRole("button", { name: "Nova compra" }).first().click();
  await page.getByTestId("purchase-supplier-select").click();
  await page.getByRole("option", { name: "Adega Central" }).click();
  await page.getByTestId("purchase-item-product").first().click();
  await page.getByRole("option", { name: "Vinho Tinto" }).click();

  // A linha mostra o custo por unidade derivado
  await expect(page.getByText(/30,00\/unidade/)).toBeVisible();
});
