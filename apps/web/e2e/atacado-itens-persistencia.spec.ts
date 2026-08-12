import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("atacado: itens expansíveis na listagem e filtros persistem ao voltar do detalhe", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `atkp_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Persistência");
  await page.getByLabel("Seu nome").fill("Bia");
  await page.getByLabel("CNPJ ou CPF").fill(String(stamp).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cat = await (
    await page.request.post(`${API}/categories`, { headers: auth, data: { name: "Girassóis" } })
  ).json();
  const prod = await (
    await page.request.post(`${API}/products`, {
      headers: auth,
      data: { name: "Girassol Gigante", categoryId: cat.id, unit: "MACO", defaultSalePrice: 40 },
    })
  ).json();
  const customer = await (
    await page.request.post(`${API}/customers`, {
      headers: auth,
      data: { name: "Mercado das Flores" },
    })
  ).json();
  // Pendente de entrega: 7 maços.
  await page.request.post(`${API}/events/quick`, {
    headers: auth,
    data: {
      channel: "WHOLESALE",
      customerId: customer.id,
      items: [{ productId: prod.id, quantity: 7, unitSalePrice: 35 }],
    },
  });

  await page.goto("/atacado");

  // 1) Linha expansível: itens visíveis sem abrir o detalhe.
  await page.getByRole("button", { name: "Ver itens" }).first().click();
  await expect(page.locator("table").getByText("Girassol Gigante")).toBeVisible();
  await expect(page.locator("table").getByText("7 Maço")).toBeVisible();

  // 2) Insights com "Falta entregar" respeitando o período atual.
  await page.getByRole("button", { name: "Insights do período" }).click();
  await expect(page.getByText("Falta entregar")).toBeVisible();
  // O nome também aparece na tabela — o primeiro na DOM é o do painel de insights.
  await expect(page.getByText("Mercado das Flores").first()).toBeVisible();
  // Somatório por produto no rodapé da seção.
  await expect(page.getByText("Total por produto")).toBeVisible();
  // O detalhamento por cliente tem o mesmo texto — basta um visível.
  await expect(page.getByText("7 maços — Girassol Gigante").first()).toBeVisible();

  // 3) Filtro aplicado vai para a URL…
  await page.getByRole("button", { name: "A entregar" }).click();
  await expect(page).toHaveURL(/entrega=nao/);

  // …e sobrevive ao ir-e-voltar do detalhe.
  await page.getByRole("link", { name: "Ver detalhes" }).first().click();
  await page.waitForURL(/\/atacado\/[0-9a-f-]+/);
  await page.getByRole("button", { name: "Atacado" }).click();
  await expect(page).toHaveURL(/entrega=nao/);
  await expect(page.getByRole("button", { name: "Insights do período" })).toBeVisible();
});
