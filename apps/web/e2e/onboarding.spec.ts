import { expect, test } from "@playwright/test";

test("onboarding: passos personalizados por tipo de negócio + guia", async ({
  page,
}) => {
  const stamp = Date.now();
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Onboarding");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(stamp).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(`onb_${stamp}@flores.com`);
  await page.getByLabel("Senha").fill("Segredo123!");
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  // Sem foco escolhido → o checklist pergunta como o lojista vende.
  await expect(page.getByText("Como você vende?")).toBeVisible();

  // Escolhe Varejo → passos de buquê/venda direta; nada de atacado.
  await page.getByRole("button", { name: /Vendo ao cliente/ }).click();
  await expect(page.getByText("Crie uma categoria")).toBeVisible();
  await expect(page.getByText("Cadastre um produto")).toBeVisible();
  await expect(page.getByText("Monte um buquê")).toBeVisible();
  await expect(page.getByText("Faça uma venda direta")).toBeVisible();
  await expect(page.getByText("Cadastre um fornecedor")).toHaveCount(0);
  await expect(page.getByText("Faça uma venda no atacado")).toHaveCount(0);

  // "trocar" reabre a escolha → Atacado mostra fornecedor/compra/venda atacado.
  await page.getByRole("button", { name: "trocar" }).click();
  await page.getByRole("button", { name: /Revendo no atacado/ }).click();
  await expect(page.getByText("Cadastre um fornecedor")).toBeVisible();
  await expect(page.getByText("Registre uma compra")).toBeVisible();
  await expect(page.getByText("Faça uma venda no atacado")).toBeVisible();
  await expect(page.getByText("Monte um buquê")).toHaveCount(0);

  // O guia "Ajuda" abre já com o passo a passo na ordem certa (não é mais tour de áreas).
  await page.getByRole("button", { name: "Ajuda" }).click();
  await expect(page.getByText("A base: categorias e produtos")).toBeVisible();
  await expect(page.getByRole("button", { name: /Cadastrar produtos/ })).toBeVisible();
});
