import { expect, test } from "@playwright/test";

test("menu: ordem nova, filtro sem 'Vencidas', e nav segue o foco", async ({
  page,
}) => {
  const stamp = Date.now();
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Nav");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(stamp).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(`nav_${stamp}@flores.com`);
  await page.getByLabel("Senha").fill("Segredo123!");
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  const aside = page.locator("aside");

  // Sem foco escolhido: mostra tudo, com os grupos renomeados/reordenados.
  await expect(aside.getByText("Insumos e estoque", { exact: true })).toBeVisible();
  await expect(aside.getByText("Varejo", { exact: true })).toBeVisible();
  await expect(aside.getByText("Atacado", { exact: true })).toBeVisible();
  // Orçamentos migrou para o grupo Varejo.
  await expect(aside.getByRole("link", { name: "Orçamentos" })).toBeVisible();

  // Filtro de pagamento sem "Vencidas" (varejo e atacado).
  await page.goto("/vendas");
  await expect(page.getByRole("button", { name: "Pendentes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Vencidas" })).toHaveCount(0);
  await page.goto("/atacado");
  await expect(page.getByRole("button", { name: "Pendentes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Vencidas" })).toHaveCount(0);

  // Trocar o foco pela topbar → o menu esconde o canal que não uso.
  const openFocus = async (label: string) => {
    await page.locator("header button").last().click();
    await page.getByRole("menuitem", { name: "Como você vende?" }).click();
    await page.getByRole("button", { name: new RegExp(label) }).click();
  };

  await openFocus("Revendo no atacado");
  await expect(aside.getByText("Atacado", { exact: true })).toBeVisible();
  await expect(aside.getByText("Varejo", { exact: true })).toHaveCount(0);

  await openFocus("Vendo ao cliente");
  await expect(aside.getByText("Varejo", { exact: true })).toBeVisible();
  await expect(aside.getByText("Atacado", { exact: true })).toHaveCount(0);
});
