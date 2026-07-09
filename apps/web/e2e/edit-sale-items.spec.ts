import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("detalhar uma venda avulsa: adiciona itens mantendo o valor fixo", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `edititems_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Itens");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  // Catálogo + venda avulsa (valor livre R$ 100) via API
  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cat = await page.request.post(`${API}/categories`, {
    headers: auth,
    data: { name: "Rosas" },
  });
  await page.request.post(`${API}/products`, {
    headers: auth,
    data: {
      name: "Rosa Bonita",
      categoryId: (await cat.json()).id,
      unit: "UNIDADE",
      defaultPurchasePrice: 4,
      defaultSalePrice: 10,
    },
  });
  const sale = await page.request.post(`${API}/events/quick`, {
    headers: auth,
    data: { amount: 100 },
  });
  const saleId = (await sale.json()).id;

  // Detalhe: começa como valor livre, sem itens
  await page.goto(`/vendas/${saleId}`);
  await expect(
    page.getByText("Venda de valor livre — sem itens detalhados."),
  ).toBeVisible();

  // Adiciona itens (abre em "Valor fixo", preservando R$ 100)
  await page.getByRole("button", { name: "Adicionar itens" }).click();
  await expect(page.getByRole("heading", { name: "Editar itens vendidos" })).toBeVisible();
  await page.getByRole("button", { name: /Rosa Bonita/ }).click();
  await page.getByRole("button", { name: /Salvar itens/ }).click();
  await expect(page.getByText("Itens da venda atualizados.")).toBeVisible();
  // Espera o diálogo fechar
  await expect(
    page.getByRole("heading", { name: "Editar itens vendidos" }),
  ).toHaveCount(0);

  // Agora mostra o item; o valor da venda continua R$ 100
  await expect(page.getByText("Itens vendidos", { exact: true })).toBeVisible();
  await expect(page.getByText("Rosa Bonita")).toBeVisible();
  await expect(
    page.getByText("Venda de valor livre — sem itens detalhados."),
  ).toHaveCount(0);
  await expect(page.getByText("R$ 100,00").first()).toBeVisible();

  // Confirma no backend
  const detail = await page.request.get(`${API}/events/${saleId}`, {
    headers: auth,
  });
  const body = await detail.json();
  expect(body.soldValue).toBe(100);
  expect(body.items).toHaveLength(1);
  expect(body.items[0].description).toBe("Rosa Bonita");
});
