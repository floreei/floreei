import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("venda: flag 'já entregue' por canal + detalhe do atacado volta para /atacado", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `deliv_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Entrega");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(stamp).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  // Seed: insumo revendável + venda no atacado (via API).
  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cat = await (
    await page.request.post(`${API}/categories`, { headers: auth, data: { name: "Rosas" } })
  ).json();
  const prod = await (
    await page.request.post(`${API}/products`, {
      headers: auth,
      data: { name: "Rosa", categoryId: cat.id, unit: "MACO", defaultSalePrice: 10 },
    })
  ).json();
  const sale = await (
    await page.request.post(`${API}/events/quick`, {
      headers: auth,
      data: { channel: "WHOLESALE", items: [{ productId: prod.id, quantity: 2, unitSalePrice: 8 }] },
    })
  ).json();

  // Detalhe da venda do atacado: voltar = "Atacado" e leva para /atacado.
  // "Ver detalhes" na lista do atacado leva para /atacado/[id] (não /vendas).
  await page.goto("/atacado");
  await page.getByRole("link", { name: "Ver detalhes" }).first().click();
  await expect(page).toHaveURL(new RegExp(`/atacado/${sale.id}$`));
  const back = page.getByRole("link", { name: "Atacado", exact: true });
  await expect(back).toBeVisible();
  await expect(back).toHaveAttribute("href", "/atacado");

  // Venda direta: "Já entregue" vem MARCADA por padrão (balcão).
  await page.goto("/inicio");
  await page.getByRole("button", { name: "Nova venda" }).first().click();
  await expect(
    page.getByRole("dialog").locator('input[type="checkbox"]'),
  ).toBeChecked();
  await page.keyboard.press("Escape");

  // Atacado: "Já entregue" vem DESMARCADA por padrão (pedido/retirada).
  await page.goto("/atacado");
  await page.getByRole("button", { name: "Nova venda no atacado" }).first().click();
  await expect(
    page.getByRole("dialog").locator('input[type="checkbox"]'),
  ).not.toBeChecked();
});
