import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("atacado: vive separado do varejo — nav, dialog dedicado, canal e listas", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `atacado_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Atacado");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  // Produto de pacote: maço com 5 hastes, compra 15/maço, venda 30/maço, custo 3/haste
  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cat = await page.request.post(`${API}/categories`, {
    headers: auth,
    data: { name: "Hortênsias" },
  });
  const pid = await (
    await page.request.post(`${API}/products`, {
      headers: auth,
      data: {
        name: "Hortênsia Azul",
        categoryId: (await cat.json()).id,
        unit: "HASTE",
        purchaseUnit: "MACO",
        packSize: 5,
        defaultPurchasePrice: 15,
        defaultSalePrice: 30,
        currentUnitCost: 3,
      },
    })
  ).json();
  await page.request.post(`${API}/arrangements`, {
    headers: auth,
    data: {
      name: "Buquê Teste",
      salePrice: 50,
      items: [{ productId: pid.id, quantity: 3 }],
    },
  });

  // Venda rápida (varejo) só tem Buquês + Valor livre — a revenda migrou pro
  // Atacado, então o produto avulso não aparece mais aqui.
  await page.goto("/inicio");
  await page.getByRole("button", { name: "Nova venda" }).first().click();
  await expect(page.getByRole("button", { name: /Buquê Teste/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Revenda", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");

  // Nova seção "Atacado" no menu.
  await page.getByRole("link", { name: "Vendas no atacado" }).click();
  await page.waitForURL(/\/atacado/);
  await page.getByRole("button", { name: "Nova venda no atacado" }).click();
  await expect(page.getByRole("button", { name: /Hortênsia Azul/ })).toBeVisible();
  await page.getByRole("button", { name: /Hortênsia Azul/ }).click();

  // Toggle aparece; padrão Maço → total da linha R$ 30,00
  await expect(page.getByRole("button", { name: "Maço", exact: true })).toBeVisible();
  await expect(page.getByText("R$ 30,00").first()).toBeVisible();

  // Troca para Haste → preço sugerido R$ 6,00 (30 ÷ 5)
  await page.getByRole("button", { name: "Haste", exact: true }).click();
  await expect(page.getByText("R$ 6,00").first()).toBeVisible();

  // Volta para Maço e registra
  await page.getByRole("button", { name: "Maço", exact: true }).click();
  await page.getByRole("button", { name: /Registrar venda/ }).click();
  await expect(page.getByText(/Venda registrada/)).toBeVisible();

  // Backend: canal WHOLESALE, vendeu 1 maço → custo 15 (5×3), estoque −5, item em MACO
  const list = await page.request.get(`${API}/events?channel=WHOLESALE`, { headers: auth });
  const sales = (await list.json()).data;
  expect(sales).toHaveLength(1);
  const saleId = sales[0].id;
  const detail = await (
    await page.request.get(`${API}/events/${saleId}`, { headers: auth })
  ).json();
  expect(detail.channel).toBe("WHOLESALE");
  expect(detail.soldValue).toBe(30);
  expect(detail.cost).toBe(15);
  expect(detail.items[0]).toMatchObject({ unit: "MACO", quantity: 1 });

  const stock = await (
    await page.request.get(`${API}/stock/overview`, { headers: auth })
  ).json();
  const level = stock.levels.find((l: { productId: string }) => l.productId === pid.id);
  expect(level.onHand).toBe(-5);

  // A venda aparece na lista /atacado, mas NÃO em /vendas — testado pela UI
  // (não só pela API), pois a página filtra pelo hook useEvents.
  await page.goto("/atacado");
  await expect(page.locator("table")).toContainText("R$ 30,00");
  await page.goto("/vendas");
  await expect(page.getByText("Nenhuma venda")).toBeVisible();

  const retail = await page.request.get(`${API}/events?channel=RETAIL`, { headers: auth });
  expect((await retail.json()).data).toHaveLength(0);
});
