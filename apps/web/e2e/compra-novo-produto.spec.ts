import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("compra: sem descrição livre, Registrar novo produto vira linha", async ({ page }) => {
  const stamp = Date.now();
  const email = `cmp_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Compra");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(stamp).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  // Seed: fornecedor + categoria (via API), para a compra abrir e o cadastro ter categoria.
  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  await page.request.post(`${API}/suppliers`, { headers: auth, data: { name: "Ceasa" } });
  await page.request.post(`${API}/categories`, { headers: auth, data: { name: "Rosas" } });

  await page.goto("/compras");
  await page.getByRole("button", { name: "Nova compra" }).first().click();

  // O campo de descrição livre sumiu; o botão de cadastrar existe.
  await expect(page.getByPlaceholder("Ou descreva (não atualiza estoque)")).toHaveCount(0);

  // Registrar novo produto → vira linha da compra.
  await page.getByRole("button", { name: "Registrar novo produto" }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "Novo produto" });
  await dialog.getByLabel("Nome").fill("Rosa Vermelha");
  await dialog.getByTestId("product-category-select").click();
  await page.getByRole("option", { name: "Rosas" }).click();
  await dialog.getByRole("button", { name: "Salvar" }).click();

  await expect(page.getByTestId("purchase-item-product").first()).toContainText("Rosa Vermelha");
});
