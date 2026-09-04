import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

test("atacado: semana, custo por item, sociedade e modal Resultado do período", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `atacado_res_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Resultado");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(stamp).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cat = await (
    await page.request.post(`${API}/categories`, { headers: auth, data: { name: "Rosas" } })
  ).json();
  await page.request.post(`${API}/products`, {
    headers: auth,
    data: {
      name: "Rosa Vermelha",
      categoryId: cat.id,
      unit: "MACO",
      defaultPurchasePrice: 15,
      defaultSalePrice: 25,
      currentUnitCost: 15,
      showInWholesale: true,
      profitShares: 3,
    },
  });
  const today = iso(new Date());
  await page.request.post(`${API}/expenses`, {
    headers: auth,
    data: { description: "Ajudante", costCenter: "Salários", amount: 4, dueDate: today },
  });

  // Venda no atacado com custo ajustado (compra a 16, vende a 25 → lucro 9) e
  // sociedade a 3 (depois reduzida para 2) → sua parte 9/2 = 4,50.
  await page.goto("/atacado");
  await page.getByRole("button", { name: "Nova venda no atacado" }).first().click();
  await page.getByRole("button", { name: /Rosa Vermelha/ }).click();
  const costInput = page.getByLabel(/^Custo/).first();
  await costInput.fill("1600");
  await expect(page.getByTestId("ws-estimated-profit")).toContainText("9,00");

  const shares = page.getByTestId(/^shares-/);
  await expect(shares).toHaveText("3");
  await page.getByRole("button", { name: "Menos pessoas" }).click();
  await expect(shares).toHaveText("2");

  await expect(page.getByTestId("ws-my-profit")).toContainText("4,50");

  await page.getByRole("button", { name: /Registrar venda/ }).click();
  await expect(page.getByText(/Venda registrada/)).toBeVisible();

  // Preset "Esta semana" seleciona seg→dom e as setas deslocam 7 dias.
  await page.getByRole("button", { name: "Esta semana" }).click();
  const from = page.getByLabel("Data inicial");
  const to = page.getByLabel("Data final");
  // O filtro é escrito via router.replace (URL) — assíncrono em relação ao
  // clique, então espera o valor assentar em vez de ler na hora.
  await expect
    .poll(async () => {
      const v = await from.inputValue();
      return v ? new Date(`${v}T12:00:00`).getDay() : null;
    })
    .toBe(1);
  const weekFrom = await from.inputValue();
  await page.getByRole("button", { name: "Semana anterior" }).click();
  await expect.poll(() => from.inputValue()).not.toBe(weekFrom);
  const prevFrom = await from.inputValue();
  expect(
    (new Date(`${weekFrom}T12:00:00`).getTime() - new Date(`${prevFrom}T12:00:00`).getTime()) /
      86_400_000,
  ).toBe(7);
  await page.getByRole("button", { name: "Próxima semana" }).click();
  await expect(from).toHaveValue(weekFrom);
  await expect(to).not.toHaveValue("");

  // Modal: lucro do pedido = 9, sua parte 4,50; despesa 4 → líquido 0,50.
  await page.getByRole("button", { name: "Resultado do período" }).click();
  const dialog = page.getByRole("dialog", { name: "Resultado do período" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Lucro bruto", { exact: true }).locator("..")).toContainText(
    "9,00",
  );
  await expect(dialog.getByText("Sua parte").first()).toBeVisible();
  await expect(dialog.getByText("Ajudante")).toBeVisible();

  const net = dialog.getByTestId("period-net");
  await expect(net).toContainText("Parte dos sócios");
  await expect(net).toContainText("4,50");
  await expect(net).toContainText("0,50");
});
