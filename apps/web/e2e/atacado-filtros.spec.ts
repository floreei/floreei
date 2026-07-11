import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("atacado: filtros pago/entrega, insights, toggle de entrega e carrinho arejado", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `atkf_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Atk");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(stamp).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cat = await (
    await page.request.post(`${API}/categories`, { headers: auth, data: { name: "Hortênsias" } })
  ).json();
  const mk = async (name: string) =>
    (
      await page.request.post(`${API}/products`, {
        headers: auth,
        data: { name, categoryId: cat.id, unit: "MACO", defaultSalePrice: 30 },
      })
    ).json();
  await mk("Hortênsias Azuis");
  await mk("Hortênsias Brancas");
  // Uma venda no atacado (via API) para a tabela ter linha + toggle.
  await page.request.post(`${API}/events/quick`, {
    headers: auth,
    data: { channel: "WHOLESALE", items: [{ productId: (await mk("Rosa")).id, quantity: 2, unitSalePrice: 25 }] },
  });

  // --- Atacado: filtros + insights + toggle ---
  await page.goto("/atacado");
  await expect(page.getByRole("button", { name: "Pagas" })).toBeVisible();
  await expect(page.getByRole("button", { name: "A entregar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Insights do período" })).toBeVisible();
  // Mês atual marcado por padrão.
  await expect(page.getByRole("button", { name: "Este mês" })).toBeVisible();

  // Toggle de entrega na tabela: começa "A entregar", vira "Entregue".
  const toggle = page.getByRole("switch").first();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");

  // Insights do atacado abrem.
  await page.getByRole("button", { name: "Insights do período" }).click();
  await expect(page.getByText("Mais vendidos")).toBeVisible();

  // --- Carrinho arejado (nome inteiro, sem truncar) ---
  await page.getByRole("button", { name: "Nova venda no atacado" }).first().click();
  await page.getByRole("button", { name: /Hortênsias Azuis/ }).click();
  await page.getByRole("button", { name: /Hortênsias Brancas/ }).click();
  // Total do rodapé confirma os 2 itens no carrinho (30 + 30).
  await expect(page.getByText("R$ 60,00")).toBeVisible();
});
