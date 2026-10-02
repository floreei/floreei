import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("atacado: switch A cobrar/Cobrado, filtro de cobrança e marcação pelo WhatsApp", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `atcb_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Cobrança");
  await page.getByLabel("Seu nome").fill("Bia");
  await page.getByLabel("CNPJ ou CPF").fill(String(stamp).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  // Cliente sem WhatsApp: "Cobrar no WhatsApp" cai no link copiado (sem abrir aba).
  const customer = await (
    await page.request.post(`${API}/customers`, {
      headers: auth,
      data: { name: "Mercado das Flores" },
    })
  ).json();
  const sale = async (title: string, amount: number) =>
    (
      await page.request.post(`${API}/events/quick`, {
        headers: auth,
        data: { channel: "WHOLESALE", customerId: customer.id, title, amount },
      })
    ).json();
  await sale("Pedido Rosas", 100);
  await sale("Pedido Lírios", 200);
  const paid = await sale("Pedido Quitado", 50);
  await page.request.post(`${API}/finance/events/${paid.id}/payments`, {
    headers: auth,
    data: { amount: 50, method: "PIX" },
  });

  await page.goto("/atacado");
  const table = page.locator("table");
  const row = (title: string) => table.locator("tr", { hasText: title });
  const chargeSwitch = (title: string) =>
    row(title).getByRole("switch", { name: /A cobrar|Cobrado/ });

  // Venda em aberto começa "A cobrar"; quitada não tem switch de cobrança.
  await expect(chargeSwitch("Pedido Rosas")).toHaveAttribute("aria-checked", "false");
  await expect(chargeSwitch("Pedido Quitado")).toHaveCount(0);

  // 1) Switch direto na linha, como o de entrega.
  await chargeSwitch("Pedido Rosas").click();
  await expect(chargeSwitch("Pedido Rosas")).toHaveAttribute("aria-checked", "true");
  await expect(chargeSwitch("Pedido Rosas")).toHaveText("Cobrado");

  // 2) Filtro de cobrança vai para a URL e separa as vendas em aberto.
  await page.getByRole("button", { name: "Cobradas" }).click();
  await expect(page).toHaveURL(/cobranca=sim/);
  await expect(row("Pedido Rosas")).toBeVisible();
  await expect(row("Pedido Lírios")).toHaveCount(0);
  await expect(row("Pedido Quitado")).toHaveCount(0);

  await page.getByRole("button", { name: "A cobrar" }).click();
  await expect(page).toHaveURL(/cobranca=nao/);
  await expect(row("Pedido Lírios")).toBeVisible();
  await expect(row("Pedido Rosas")).toHaveCount(0);
  await expect(row("Pedido Quitado")).toHaveCount(0);

  // 3) "Cobrar no WhatsApp" já marca a venda como cobrada: ela sai do "A cobrar".
  await row("Pedido Lírios").getByRole("button", { name: "Ações da venda" }).click();
  await page.getByRole("menuitem", { name: "Cobrar no WhatsApp" }).click();
  await expect(row("Pedido Lírios")).toHaveCount(0);
  await page.getByRole("button", { name: "Cobrança: todas" }).click();
  await expect(chargeSwitch("Pedido Lírios")).toHaveAttribute("aria-checked", "true");

  // Desmarcar devolve para "A cobrar".
  await chargeSwitch("Pedido Lírios").click();
  await expect(chargeSwitch("Pedido Lírios")).toHaveAttribute("aria-checked", "false");
});
