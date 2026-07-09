import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("clientes: canal separa quem aparece em cada venda", async ({ page }) => {
  const stamp = Date.now();
  const email = `ccanal_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Canal");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  await page.request.post(`${API}/customers`, {
    headers: auth,
    data: { name: "Maria Direta", channel: "RETAIL" },
  });
  await page.request.post(`${API}/customers`, {
    headers: auth,
    data: { name: "Distribuidora Atacado LTDA", channel: "WHOLESALE" },
  });

  // Lista de clientes: badge de canal + filtro.
  await page.goto("/clientes");
  await expect(page.locator("table")).toContainText("Maria Direta");
  await expect(page.locator("table")).toContainText("Distribuidora Atacado LTDA");
  await page.getByRole("button", { name: "Atacado", exact: true }).click();
  await expect(page.locator("table")).toContainText("Distribuidora Atacado LTDA");
  await expect(page.locator("table").getByText("Maria Direta")).toHaveCount(0);
  await page.getByRole("button", { name: "Venda direta", exact: true }).click();
  await expect(page.locator("table")).toContainText("Maria Direta");
  await expect(page.locator("table").getByText("Distribuidora Atacado LTDA")).toHaveCount(0);

  // Venda direta: seletor de cliente só mostra o de varejo.
  await page.goto("/inicio");
  await page.getByRole("button", { name: "Nova venda" }).first().click();
  await expect(page.getByRole("dialog").getByText("Venda direta")).toBeVisible();
  await page.getByRole("dialog").getByRole("combobox").click();
  await expect(page.getByRole("option", { name: "Maria Direta" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Distribuidora Atacado LTDA" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");

  // Atacado: seletor de cliente só mostra o de atacado.
  await page.goto("/atacado");
  await page.getByRole("button", { name: "Nova venda no atacado" }).first().click();
  await page.getByRole("dialog").getByRole("combobox").click();
  await expect(page.getByRole("option", { name: "Distribuidora Atacado LTDA" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Maria Direta" })).toHaveCount(0);

  // Novo cliente: dentro da venda no atacado, já nasce marcado como Atacado.
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Novo cliente" }).click();
  await expect(page.getByRole("heading", { name: "Novo cliente" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Atacado", exact: true }).last()).toHaveClass(
    /border-primary/,
  );
});
