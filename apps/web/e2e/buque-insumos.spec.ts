import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("buquê: seletor de produto busca e agrupa por categoria (flor, laço, doce)", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `buque_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Buquê");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  // Catálogo: 3 categorias distintas, incluindo não-flores
  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cat = async (name: string) =>
    (await page.request.post(`${API}/categories`, { headers: auth, data: { name } })).json();
  const prod = (name: string, categoryId: string, cost: number) =>
    page.request.post(`${API}/products`, {
      headers: auth,
      data: {
        name,
        categoryId,
        unit: "UNIDADE",
        defaultPurchasePrice: cost,
        defaultSalePrice: cost * 2,
        currentUnitCost: cost,
      },
    });
  const rosas = await cat("Rosas");
  const lacos = await cat("Laços");
  const doces = await cat("Doces");
  await prod("Rosa Nacional", rosas.id, 2);
  await prod("Laço Cetim", lacos.id, 1.5);
  await prod("Bombom Trufado", doces.id, 3);

  // Novo buquê → abre o seletor de produto
  await page.goto("/buques");
  await page.getByRole("button", { name: "Novo buquê" }).first().click();
  await page.getByTestId("arrangement-item-product").first().click();

  // Busca + agrupamento por categoria (escopado ao popover do seletor —
  // a página de Buquês também tem chips de categoria com o mesmo texto)
  await expect(page.getByPlaceholder("Buscar produto…")).toBeVisible();
  await expect(
    page.getByLabel("Suggestions").getByText("Laços", { exact: true }),
  ).toBeVisible(); // heading do grupo
  await expect(page.getByRole("option", { name: /Laço Cetim/ })).toBeVisible();
  await expect(page.getByRole("option", { name: /Bombom Trufado/ })).toBeVisible();

  // Digitar filtra: só o bombom fica
  await page.getByPlaceholder("Buscar produto…").fill("Bombom");
  await expect(page.getByRole("option", { name: /Laço Cetim/ })).toHaveCount(0);
  await page.getByRole("option", { name: /Bombom Trufado/ }).click();

  // A linha foi preenchida com o doce
  await expect(
    page.getByTestId("arrangement-item-product").first(),
  ).toContainText("Bombom Trufado");
});
