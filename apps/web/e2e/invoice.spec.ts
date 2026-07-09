import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("nota fiscal: emitir mostra NFC-e/NF-e conforme o canal, e o toggle automático dispara sozinho", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `nfe_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Nota Fiscal");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };

  // Venda direta (varejo): valor livre + emissão manual.
  await page.goto("/inicio");
  await page.getByRole("button", { name: "Nova venda" }).first().click();
  await page.getByRole("button", { name: "Valor livre" }).click();
  await page.getByLabel("Valor da venda").fill("100");
  await page.getByRole("button", { name: /Registrar venda/ }).click();
  await expect(page.getByText(/Venda registrada/)).toBeVisible();

  await page.goto("/vendas");
  await page.locator("table tbody tr").first().click();
  await page.waitForURL(/\/vendas\/[0-9a-f-]+$/);
  await expect(page.getByText("Nenhuma nota emitida (NFC-e).")).toBeVisible();

  await page.getByRole("button", { name: "Emitir nota" }).click();
  await expect(page.getByText("NFC-e", { exact: true })).toBeVisible();
  await expect(page.getByText("Rejeitada", { exact: true })).toBeVisible();
  await expect(page.getByText(/não configurado/i)).toBeVisible();
  // Sem provedor real: XML/DANFE sempre indisponíveis.
  await expect(page.getByRole("button", { name: "Baixar XML" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Baixar DANFE" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Reemitir" })).toBeVisible();

  // Venda no atacado: o mesmo fluxo deriva NF-e.
  const wholesaleCustomer = await (
    await page.request.post(`${API}/customers`, {
      headers: auth,
      data: { name: "Lojista Atacado", channel: "WHOLESALE" },
    })
  ).json();
  await page.request.post(`${API}/events/quick`, {
    headers: auth,
    data: {
      customerId: wholesaleCustomer.id,
      amount: 300,
      title: "Venda atacado",
      channel: "WHOLESALE",
    },
  });
  await page.goto("/atacado");
  await page.locator("table tbody tr").first().click();
  await page.waitForURL(/\/vendas\/[0-9a-f-]+$/);
  await page.getByRole("button", { name: "Emitir nota" }).click();
  await expect(page.getByText("NF-e", { exact: true })).toBeVisible();

  // Liga a emissão automática em Configurações.
  await page.goto("/empresa");
  await page.locator('input[type="checkbox"]').last().check();
  await page.getByRole("button", { name: "Salvar dados fiscais" }).click();
  await expect(page.getByText("Dados fiscais salvos.")).toBeVisible();

  // Nova venda direta: nota já nasce emitida, sem clicar em nada.
  await page.goto("/inicio");
  await page.getByRole("button", { name: "Nova venda" }).first().click();
  await page.getByRole("button", { name: "Valor livre" }).click();
  await page.getByLabel("Valor da venda").fill("42");
  await page.getByRole("button", { name: /Registrar venda/ }).click();
  await expect(page.getByText(/Venda registrada/)).toBeVisible();

  await page.goto("/vendas");
  await page.locator("table tbody tr").first().click();
  await page.waitForURL(/\/vendas\/[0-9a-f-]+$/);
  await expect(page.getByText("NFC-e", { exact: true })).toBeVisible();
  await expect(page.getByText("Rejeitada", { exact: true })).toBeVisible();
});
