import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("nota do pedido: abre pelo detalhe da venda e imprime", async ({ page }) => {
  const stamp = Date.now();
  const email = `nota_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 1000 });

  // Cadastro
  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Nota");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  // Semeia produto + faz a venda via API.
  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cat = await page.request.post(`${API}/categories`, {
    headers: auth,
    data: { name: "Rosas" },
  });
  const catId = (await cat.json()).id;
  const prod = await page.request.post(`${API}/products`, {
    headers: auth,
    data: {
      name: "Rosa Colombiana",
      categoryId: catId,
      unit: "UNIDADE",
      currentUnitCost: 4,
      defaultSalePrice: 10,
    },
  });
  const productId = (await prod.json()).id;
  const sale = await page.request.post(`${API}/events/quick`, {
    headers: auth,
    data: { items: [{ productId, quantity: 3, unitSalePrice: 12 }] },
  });
  const eventId = (await sale.json()).id;

  // Abre o detalhe da venda → botão "Nota do pedido" → nota.
  await page.goto(`/eventos/${eventId}`);
  await page.getByRole("link", { name: "Nota do pedido" }).click();
  await page.waitForURL(new RegExp(`/eventos/${eventId}/imprimir`));

  const note = page.locator("#print-area");
  await expect(note.getByText("Nota do pedido")).toBeVisible();
  await expect(note.getByText("Rosa Colombiana")).toBeVisible();
  await expect(note.getByText("R$ 36,00").first()).toBeVisible(); // 3 × 12
  await expect(note.getByText(/Documento não fiscal/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Imprimir / Salvar PDF" }),
  ).toBeVisible();
});
