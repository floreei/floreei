import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const dir = "/private/tmp/claude-501/-Users-hugouraga-Desktop-www-sistema-flores/9c397a10-8f13-40ea-9df3-3675fd649a6a/scratchpad";
const API = "http://localhost:3001/api";

test("fluxo de compra: pedido → receber → pagamento parcial → comprovante", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `compra_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Bela Flor");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  await page.request.post(`${API}/suppliers`, { headers: auth, data: { name: "Ceasa Flores" } });
  const cat = await page.request.post(`${API}/categories`, { headers: auth, data: { name: "Rosas" } });
  const catId = (await cat.json()).id;
  await page.request.post(`${API}/products`, {
    headers: auth,
    data: { name: "Rosa Colombiana", categoryId: catId, unit: "MACO", defaultPurchasePrice: 4, defaultSalePrice: 10, minStock: 5 },
  });

  // Nova compra (detalhada) — pedido ainda não recebido
  await page.goto("/compras");
  await page.getByRole("button", { name: "Nova compra" }).first().click();
  await page.getByTestId("purchase-supplier-select").click();
  await page.getByRole("option", { name: "Ceasa Flores" }).click();
  await page.getByTestId("purchase-item-product").first().click();
  await page.getByRole("option", { name: "Rosa Colombiana" }).click();
  await page.getByLabel("Quantidade").first().fill("20");
  await page.getByLabel("Data prevista").fill("2026-08-01");
  await page.getByRole("button", { name: "Registrar compra" }).click();
  await expect(page.getByText("Compra registrada.")).toBeVisible();

  // Abre o detalhe (link no fornecedor)
  await page.getByRole("link", { name: "Ceasa Flores" }).click();
  await page.waitForURL(/\/compras\/[0-9a-f-]+/);
  await expect(page.getByText("Aguardando entrega")).toBeVisible();
  await expect(page.getByText("Rosa Colombiana")).toBeVisible();
  await page.screenshot({ path: `${dir}/compra-detalhe.png`, fullPage: true });

  // Edição TRAZ os dados (não vem vazio)
  await page.getByRole("button", { name: "Editar" }).click();
  await expect(page.getByTestId("purchase-total")).toContainText("80,00"); // 20 × 4
  await page.screenshot({ path: `${dir}/compra-edicao.png` });
  await page.keyboard.press("Escape");

  // Marca como recebida → entra no estoque
  await page.getByRole("button", { name: "Marcar como recebida" }).click();
  await expect(page.getByText("Recebida", { exact: true })).toBeVisible();

  // Estoque atualizou
  await page.goto("/estoque");
  await expect(page.getByText("Rosa Colombiana")).toBeVisible();

  // Pagamento parcial
  await page.goBack();
  await page.getByRole("button", { name: "Registrar pagamento" }).click();
  await page.getByLabel("Valor").fill("3000"); // R$ 30,00 (parcial de 80)
  await page.getByRole("button", { name: "Pagar", exact: true }).click();
  await expect(page.getByText("Pagamento registrado.")).toBeVisible();

  // Anexos agora são upload de arquivo (Firebase Storage). O upload em si exige
  // o emulador de storage (Java 21), então aqui só validamos que o controle existe.
  await expect(
    page.getByRole("button", { name: "Anexar arquivo" }),
  ).toBeVisible();
});
