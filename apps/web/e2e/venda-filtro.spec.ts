import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("nova venda: filtra Buquês x Revenda mostrando só o conteúdo de cada", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `venda_f_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Filtro");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cat = await (
    await page.request.post(`${API}/categories`, { headers: auth, data: { name: "Rosas" } })
  ).json();
  // Insumo de revenda (avulso)
  const rosa = await (
    await page.request.post(`${API}/products`, {
      headers: auth,
      data: {
        name: "Rosa Avulsa",
        categoryId: cat.id,
        unit: "UNIDADE",
        defaultSalePrice: 5,
        currentUnitCost: 2,
      },
    })
  ).json();
  // Buquê (usa a rosa na ficha técnica)
  await page.request.post(`${API}/arrangements`, {
    headers: auth,
    data: {
      name: "Buquê Teste",
      salePrice: 50,
      items: [{ productId: rosa.id, quantity: 3 }],
    },
  });

  // Nova venda → aba padrão Buquês: só buquê
  await page.goto("/inicio");
  await page.getByRole("button", { name: "Nova venda" }).first().click();
  await expect(page.getByRole("button", { name: /Buquê Teste/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Rosa Avulsa/ })).toHaveCount(0);

  // Aba Revenda: só o insumo avulso
  await page.getByRole("button", { name: "Revenda", exact: true }).click();
  await expect(page.getByRole("button", { name: /Rosa Avulsa/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Buquê Teste/ })).toHaveCount(0);
});
