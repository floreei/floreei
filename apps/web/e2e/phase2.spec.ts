import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("fase 2: monta buquê pela UI e vê custo/lucro ao vivo", async ({ page }) => {
  const stamp = Date.now();
  const email = `fase2_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  // Cadastro
  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Fase 2");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  // Semeia os insumos via API (com custo por unidade-base).
  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cat = await page.request.post(`${API}/categories`, {
    headers: auth,
    data: { name: "Insumos" },
  });
  const categoryId = (await cat.json()).id;
  const insumo = (name: string, unit: string, currentUnitCost: number) =>
    page.request.post(`${API}/products`, {
      headers: auth,
      data: { name, categoryId, unit, currentUnitCost },
    });
  await insumo("Hortênsia F2", "HASTE", 3);
  await insumo("Rosa F2", "UNIDADE", 2.5);
  await insumo("Fita F2", "METRO", 1.2);

  // Monta o buquê pela UI (ficha técnica).
  await page.goto("/buques");
  await page.getByRole("button", { name: "Novo buquê" }).first().click();
  await page.getByLabel("Nome").fill("Buquê Encanto");
  // Preço fixo é o modo padrão; o campo é a CurrencyInput #a-sale.
  // CurrencyInput acumula centavos: "10000" = R$ 100,00.
  await page.locator("#a-sale").fill("10000");

  const pickInsumo = async (row: number, name: string) => {
    await page.getByTestId("arrangement-item-product").nth(row).click();
    await page.getByRole("option", { name: new RegExp(name) }).click();
  };

  await pickInsumo(0, "Hortênsia F2");
  await page.getByLabel("Quantidade").nth(0).fill("1");
  await page.getByRole("button", { name: "Adicionar insumo" }).click();
  await pickInsumo(1, "Rosa F2");
  await page.getByLabel("Quantidade").nth(1).fill("3");
  await page.getByRole("button", { name: "Adicionar insumo" }).click();
  await pickInsumo(2, "Fita F2");
  await page.getByLabel("Quantidade").nth(2).fill("1");

  // Custo ao vivo: 1×3 + 3×2,50 + 1×1,20 = 11,70.
  await expect(page.getByTestId("arrangement-cost")).toContainText("11,70");

  await page.getByRole("button", { name: "Criar buquê" }).click();

  // Aparece na lista com o custo e a venda calculados.
  const row = page.getByRole("row", { name: /Buquê Encanto/ });
  await expect(row).toBeVisible();
  await expect(row).toContainText("11,70");
  await expect(row).toContainText("100,00");
  await expect(row).toContainText("88,30");
});
