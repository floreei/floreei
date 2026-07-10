import { expect, test } from "@playwright/test";

const stamp = Date.now();
const email = `ws_inline_${stamp}@flores.com`;
const password = "Segredo123!";

test("atacado: cadastra categoria e insumo sem sair da venda", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill(`Floricultura WS ${stamp}`);
  await page.getByLabel("Seu nome").fill("Ana WS");
  await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  await page.goto("/atacado");
  await page.getByRole("button", { name: "Nova venda no atacado" }).first().click();

  // Estado vazio acionável (empresa nova, zero insumo).
  await expect(
    page.getByText("Você ainda não cadastrou nenhum insumo."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cadastrar insumo" }).click();

  // Zero categoria também: o próprio diálogo de insumo guia a criação.
  const productDialog = page.getByRole("dialog", { name: "Novo insumo" });
  await expect(productDialog.getByText("Nenhuma categoria ainda")).toBeVisible();
  await productDialog.getByRole("button", { name: "Nova categoria" }).click();

  const categoryDialog = page.getByRole("dialog", { name: "Nova categoria" });
  await categoryDialog.locator("#cat-name").fill("Rosas WS");
  await categoryDialog.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Categoria salva.")).toBeVisible();

  // Categoria recém-criada já vem selecionada.
  await expect(
    productDialog.getByTestId("product-category-select"),
  ).toContainText("Rosas WS");

  await productDialog.locator("#p-name").fill("Rosa Vermelha WS");

  // Preço de venda é obrigatório neste contexto (senão o insumo não aparece
  // na lista do atacado) — confirma que o submit é bloqueado sem preço.
  await productDialog.getByRole("button", { name: "Salvar" }).click();
  await expect(
    page.getByText("Preço obrigatório pra vender este insumo no atacado."),
  ).toBeVisible();

  await productDialog.locator("#p-sale").fill("2500");
  await productDialog.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Insumo salvo.")).toBeVisible();

  // Insumo recém-criado cai direto no carrinho, sem precisar procurar —
  // some o placeholder do carrinho vazio e o botão de registrar libera.
  await expect(page.getByText("Toque num item para adicionar.")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Registrar venda/ }),
  ).toBeEnabled();

  await page.getByRole("button", { name: /Registrar venda/ }).click();
  await expect(page.getByText(/Venda registrada/)).toBeVisible();
});
