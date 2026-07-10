import { expect, test } from "@playwright/test";

const stamp = Date.now();
const email = `ncm_${stamp}@flores.com`;
const password = "Segredo123!";
const categoryName = `Flores ${stamp}`;
const productName = `Rosa NCM ${stamp}`;

test("NCM: busca por texto no cadastro de insumo e persiste o código escolhido", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill(`Floricultura NCM ${stamp}`);
  await page.getByLabel("Seu nome").fill("Ana NCM");
  await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await expect(page).toHaveURL(/\/inicio/);

  await page.goto("/insumos");
  await page.getByRole("button", { name: "Nova categoria" }).first().click();
  await page.getByLabel("Nome").fill(categoryName);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(categoryName)).toBeVisible();

  await page.getByRole("button", { name: "Novo insumo" }).first().click();
  await page.getByLabel("Nome").fill(productName);
  await page.getByTestId("product-category-select").click();
  await page.getByRole("option", { name: categoryName }).click();
  await page.getByLabel("Preço de compra").fill("400");
  await page.getByLabel("Preço de venda").fill("1000");

  await page.getByTestId("product-ncm-combobox").click();
  await page.getByPlaceholder(/Código ou nome/).fill("rosas");
  const option = page.getByText("06031100", { exact: true });
  await expect(option).toBeVisible();
  await option.click();
  await expect(page.getByTestId("product-ncm-combobox")).toContainText("06031100");

  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.locator("table").getByText(productName)).toBeVisible();

  // Reabre o insumo salvo e confirma que o NCM persistiu.
  const row = page.locator("table tbody tr", { hasText: productName });
  await row.getByRole("button", { name: "Ações" }).click();
  await page.getByRole("menuitem", { name: "Editar" }).click();
  await expect(page.getByTestId("product-ncm-combobox")).toContainText("06031100");
});
