import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("vendas: busca por nome, filtro de período e paginação", async ({ page }) => {
  const stamp = Date.now();
  const email = `vfiltros_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Filtros");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };

  // 22 vendas: 21 avulsas + 1 com nome único para testar a busca. Mais que
  // uma página (20 por página) para testar a paginação.
  for (let i = 0; i < 21; i++) {
    const customer = await (
      await page.request.post(`${API}/customers`, { headers: auth, data: { name: `Cliente ${i}` } })
    ).json();
    await page.request.post(`${API}/events/quick`, {
      headers: auth,
      data: { customerId: customer.id, amount: 10 + i, title: `Venda ${i}`, channel: "RETAIL" },
    });
  }
  const unique = await (
    await page.request.post(`${API}/customers`, { headers: auth, data: { name: "Zebedeu Lojista Único" } })
  ).json();
  await page.request.post(`${API}/events/quick`, {
    headers: auth,
    data: { customerId: unique.id, amount: 99, title: "Venda especial", channel: "RETAIL" },
  });

  await page.goto("/vendas");
  await page.waitForLoadState("networkidle");

  // Paginação: 22 vendas, 20/página → 2 páginas.
  await expect(page.getByText("Página 1 de 2")).toBeVisible();
  const nextBtn = page.getByRole("button", { name: "Próxima" });
  const prevBtn = page.getByRole("button", { name: "Anterior" });
  await expect(prevBtn).toBeDisabled();
  await nextBtn.click();
  await expect(page.getByText("Página 2 de 2")).toBeVisible();
  await expect(nextBtn).toBeDisabled();
  await prevBtn.click();
  await expect(page.getByText("Página 1 de 2")).toBeVisible();

  // Busca: filtra pro nome único, some a paginação (só 1 resultado).
  await page.getByPlaceholder("Buscar por cliente ou título…").fill("Zebedeu");
  await expect(page.locator("table").getByText("Zebedeu Lojista Único")).toBeVisible();
  await expect(page.getByText("Página 1 de 2")).toHaveCount(0);

  // Período "Hoje": todas as vendas foram criadas agora, então continuam visíveis.
  await page.getByPlaceholder("Buscar por cliente ou título…").fill("");
  await page.getByRole("button", { name: "Hoje", exact: true }).click();
  await expect(page.locator("table").getByText("Venda 0")).toBeVisible();

  // Data futura isolada: não deve haver nenhuma venda.
  await page.getByRole("button", { name: "Todo período", exact: true }).click();
  await page.getByLabel("Data inicial").fill("2099-01-01");
  await page.getByLabel("Data final").fill("2099-01-02");
  await expect(page.getByText("Nada encontrado")).toBeVisible();
});
