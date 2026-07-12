import { expect, test } from "@playwright/test";

test("cobrança: liga a régua, configura PIX e vê a prévia; nav mostra Cobrança", async ({
  page,
}) => {
  const stamp = Date.now();
  await page.setViewportSize({ width: 1280, height: 1000 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Cobrança");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(stamp).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(`cob_${stamp}@flores.com`);
  await page.getByLabel("Senha").fill("Segredo123!");
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  // Nav mostra "Cobrança" no grupo Financeiro.
  await expect(page.locator('aside a[href="/cobranca"]')).toBeVisible();

  await page.goto("/cobranca");
  await expect(page.getByRole("heading", { name: "Cobrança automática" })).toBeVisible();

  // Liga a régua.
  await page.getByRole("switch").first().click();

  // Escolhe PIX e preenche a chave → aparece na prévia.
  await page.getByRole("button", { name: "Chave PIX" }).click();
  await page.getByLabel("Chave PIX").fill("flor@floreei.com.br");
  await expect(page.getByText("Pra facilitar, o PIX é: flor@floreei.com.br")).toBeVisible();

  // Passo a passo do Mercado Pago aparece ao trocar pro link.
  await page.getByRole("button", { name: "Link Mercado Pago" }).click();
  await page.getByRole("button", { name: "Como criar seu link no Mercado Pago" }).click();
  await expect(page.getByText(/confira.*taxas/i)).toBeVisible();

  // Salva.
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Cobrança automática salva.")).toBeVisible();
});
