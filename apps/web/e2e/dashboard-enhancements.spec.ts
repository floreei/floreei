import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("vendas ganham selo/saldo/filtro de pagamento e insights; fornecedores ganham ranking", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `dash_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  // Cadastro
  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Dash");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };

  // Seed: venda paga + venda a prazo
  const paid = await (
    await page.request.post(`${API}/events/quick`, {
      headers: auth,
      data: { amount: 100, title: "Venda paga", channel: "RETAIL" },
    })
  ).json();
  await page.request.post(`${API}/finance/events/${paid.id}/payments`, {
    headers: auth,
    data: { amount: 100, method: "PIX" },
  });
  await page.request.post(`${API}/events/quick`, {
    headers: auth,
    data: { amount: 250, title: "Venda a prazo", channel: "RETAIL" },
  });

  // Seed: fornecedor + 2 compras (para o ranking aparecer com ≥2 fornecedores)
  const today = new Date().toISOString().slice(0, 10);
  for (const name of ["Ceasa", "Atacadão"]) {
    const s = await (
      await page.request.post(`${API}/suppliers`, { headers: auth, data: { name } })
    ).json();
    await page.request.post(`${API}/purchases`, {
      headers: auth,
      data: {
        supplierId: s.id,
        date: today,
        items: [
          { description: "Rosas", quantity: name === "Ceasa" ? 50 : 5, unit: "MACO", unitPrice: 4 },
        ],
      },
    });
  }

  // --- Vendas: selo de pagamento + coluna Saldo + filtro + insights ---
  await page.goto("/vendas");
  const table = page.locator("table");
  await expect(table.getByText("Pago", { exact: true })).toBeVisible();
  await expect(table.getByText("A receber", { exact: true })).toBeVisible();

  // Filtro "Pendentes" mantém só a venda a prazo
  await page.getByRole("button", { name: "Pendentes" }).click();
  await expect(table.getByText("Venda a prazo")).toBeVisible();
  await expect(table.getByText("Venda paga")).toHaveCount(0);
  await page.getByRole("button", { name: "Todos pagamentos" }).click();

  // Insights: expande e mostra "Mais vendidos" e "Quem mais comprou"
  await page.getByRole("button", { name: "Insights do período" }).click();
  await expect(page.getByText("Mais vendidos")).toBeVisible();
  await expect(page.getByText("Quem mais comprou")).toBeVisible();

  // --- Fornecedores: ranking + coluna Total comprado ---
  await page.goto("/fornecedores");
  await expect(page.getByText("De quem você mais compra")).toBeVisible();
  await expect(
    page.locator("table").getByRole("columnheader", { name: "Total comprado" }),
  ).toBeVisible();
  // Ceasa (200) deve estar acima do Atacadão (20) no ranking
  const rankingNames = await page
    .locator("li")
    .filter({ hasText: /Ceasa|Atacadão/ })
    .allInnerTexts();
  expect(rankingNames[0]).toContain("Ceasa");
});
