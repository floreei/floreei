import { expect, test } from "@playwright/test";

const stamp = Date.now();
const email = `e2e_${stamp}@flores.com`;
const password = "Segredo123!";
const customerName = `Casamento E2E ${stamp}`;
const categoryName = `Rosas ${stamp}`;
const productName = `Rosa E2E ${stamp}`;

test("fluxo completo: cadastro → cliente → produto → orçamento → evento", async ({
  page,
}) => {
  // 1) Criar conta
  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill(`Floricultura ${stamp}`);
  await page.getByLabel("Seu nome").fill("Ana E2E");
  await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await expect(page).toHaveURL(/\/inicio/);
  await expect(page.getByText("Nova venda").first()).toBeVisible();

  // 2) Criar cliente
  await page.goto("/clientes");
  await page.getByRole("button", { name: "Novo cliente" }).first().click();
  await page.getByLabel("Nome").fill(customerName);
  await page.getByRole("button", { name: "Criar cliente" }).click();
  // A lista tem versão mobile (cards) + desktop (tabela) no DOM — mira a tabela.
  await expect(page.locator("table").getByText(customerName)).toBeVisible();

  // 3) Criar categoria + produto (compra 4, venda 10)
  await page.goto("/insumos");
  await page.getByRole("button", { name: "Nova categoria" }).click();
  await page.getByLabel("Nome").fill(categoryName);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(categoryName)).toBeVisible();

  await page.getByRole("button", { name: "Novo insumo" }).click();
  await page.getByLabel("Nome").fill(productName);
  await page.getByTestId("product-category-select").click();
  await page.getByRole("option", { name: categoryName }).click();
  // Campo de moeda (acumulador de centavos): "400" = R$ 4,00, "1000" = R$ 10,00
  await page.getByLabel("Preço de compra").fill("400");
  await page.getByLabel("Preço de venda").fill("1000");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.locator("table").getByText(productName)).toBeVisible();

  // 4) Criar orçamento com 10 unidades → venda 100, lucro 60
  await page.goto("/orcamentos/novo");
  await page.getByTestId("customer-select").click();
  await page.getByRole("option", { name: customerName }).click();
  await page.getByRole("button", { name: "Adicionar item" }).click();
  await page.getByPlaceholder("Descrição do item").fill(productName);
  await page.getByLabel("Quantidade").fill("10");
  await page.getByLabel("Preço de compra").fill("4");
  await page.getByLabel("Preço de venda").fill("10");

  // cálculo ao vivo: 10 × 10 = 100 de venda, lucro 60
  await expect(page.getByTestId("total-venda-total")).toContainText("100,00");
  await expect(page.getByTestId("total-lucro")).toContainText("60,00");

  await page.getByRole("button", { name: "Criar orçamento" }).click();
  await expect(page).toHaveURL(/\/orcamentos\/[0-9a-f-]+$/);

  // 4b) Proposta imprimível para o cliente
  await page.getByRole("link", { name: "Imprimir" }).click();
  await expect(page).toHaveURL(/\/imprimir$/);
  await expect(page.getByText("Proposta", { exact: true })).toBeVisible();
  await expect(page.getByText("R$ 100,00").first()).toBeVisible();
  await page.goBack();

  // 5) Converter em venda
  await page.getByRole("button", { name: "Converter em venda" }).click();
  await page.getByLabel("Data").fill("2026-12-20");
  await page.getByRole("button", { name: "Confirmar venda" }).click();
  await expect(page).toHaveURL(/\/vendas\/[0-9a-f-]+$/);
  await expect(page.getByText("Valor vendido")).toBeVisible();
  await expect(page.getByText("R$ 100,00").first()).toBeVisible();

  // 5b) Anexos do evento agora são upload de arquivo (Firebase Storage). O upload
  // exige o emulador de storage (Java 21); aqui só validamos que o controle existe.
  await expect(
    page.getByRole("button", { name: "Anexar arquivo" }),
  ).toBeVisible();

  // 6) Dashboard reflete a receita
  await page.goto("/dashboard");
  await expect(page.getByText("Receita do mês")).toBeVisible();

  // 7) Financeiro mostra o evento como conta a receber
  await page.goto("/financeiro");
  await expect(page.getByText("A receber").first()).toBeVisible();
  await expect(page.locator("table").getByText(customerName).first()).toBeVisible();

  // 8) Busca global (⌘K) encontra o cliente/evento
  await page.keyboard.press("Control+k");
  await page
    .getByPlaceholder(/Buscar clientes/i)
    .fill(`Casamento E2E ${stamp}`);
  await expect(
    page.getByRole("dialog").getByText(customerName).first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  // 9) Perfil do cliente com histórico e saldo
  await page.goto("/clientes");
  await page.locator("table").getByRole("link", { name: customerName }).click();
  await expect(page).toHaveURL(/\/clientes\/[0-9a-f-]+$/);
  await expect(page.getByText("Total vendido")).toBeVisible();
  await expect(page.getByText("Saldo a receber")).toBeVisible();

  // 10) Venda rápida (balcão) pelo Início → Caixa reflete a entrada
  await page.goto("/inicio");
  await page.getByRole("button", { name: "Nova venda" }).first().click();
  await page.getByRole("button", { name: "Valor livre" }).click();
  // Campo de moeda: "5000" = R$ 50,00
  await page.getByLabel("Valor da venda").fill("5000");
  await page.getByRole("button", { name: /Registrar venda/ }).click();
  await expect(page.getByText("Venda registrada e recebida.")).toBeVisible();

  await page.goto("/caixa");
  await expect(page.getByText("Saldo do período", { exact: true })).toBeVisible();
  await expect(page.getByText("R$ 50,00").first()).toBeVisible();
});
