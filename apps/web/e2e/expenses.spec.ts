import { expect, test } from "@playwright/test";

test("despesa: registra como 'a pagar', marca como paga e filtra", async ({
  page,
}) => {
  const stamp = Date.now();
  await page.setViewportSize({ width: 1280, height: 900 });

  // Cadastro
  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Despesa");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(`despesa_${stamp}@flores.com`);
  await page.getByLabel("Senha").fill("Segredo123!");
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  // Nova despesa (nasce "a pagar")
  await page.goto("/despesas");
  await page.getByRole("button", { name: "Nova despesa" }).first().click();
  await page.getByLabel("Descrição").fill("Conta de luz");
  await page.getByLabel("Valor").fill("15000"); // R$ 150,00
  await page.getByRole("button", { name: "Salvar" }).click();

  const row = page.getByRole("row", { name: /Conta de luz/ });
  await expect(row).toBeVisible();
  await expect(row.getByText("A pagar")).toBeVisible();
  await expect(row).toContainText("R$ 150,00");

  // Filtro "Pagas" esconde; "A pagar" mostra.
  await page.getByRole("button", { name: "Pagas", exact: true }).click();
  await expect(page.getByText("Conta de luz")).toHaveCount(0);
  await page.getByRole("button", { name: "A pagar", exact: true }).click();
  await expect(row).toBeVisible();

  // Marca como pago (sem comprovante — storage não emulado aqui).
  await row.getByRole("button", { name: "Ações" }).click();
  await page.getByRole("menuitem", { name: "Marcar como pago" }).click();
  await page.getByRole("button", { name: "Confirmar pagamento" }).click();

  // Sai do "a pagar" e aparece em "Pagas".
  await expect(page.getByText("Conta de luz")).toHaveCount(0);
  await page.getByRole("button", { name: "Pagas", exact: true }).click();
  const paidRow = page.getByRole("row", { name: /Conta de luz/ });
  await expect(paidRow).toBeVisible();
  await expect(paidRow.getByText("Paga")).toBeVisible();
});
