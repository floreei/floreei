import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import JSZip from "jszip";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("atacado: switch A cobrar/Cobrado, filtro de cobrança, Cobrar (PDF + mensagem) e exportação", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
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
  // Cliente sem telefone: "Cobrar" não depende de WhatsApp (baixa a nota + copia o texto).
  const customer = await (
    await page.request.post(`${API}/customers`, {
      headers: auth,
      data: { name: "Mercado das Flores" },
    })
  ).json();
  const sale = async (title: string, amount: number, deliveryDate?: string) =>
    (
      await page.request.post(`${API}/events/quick`, {
        headers: auth,
        data: { channel: "WHOLESALE", customerId: customer.id, title, amount, deliveryDate },
      })
    ).json();
  await sale("Pedido Rosas", 100, "2026-10-15");
  await sale("Pedido Lírios", 200, "2026-10-16");
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

  // 3) "Cobrar" baixa a nota em PDF, copia a mensagem (saudação + dia + link) e
  //    já marca a venda como cobrada: ela sai do "A cobrar".
  await row("Pedido Lírios").getByRole("button", { name: "Ações da venda" }).click();
  const pdfDownload = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: /^Cobrar/ }).click();
  const pdf = await pdfDownload;
  expect(pdf.suggestedFilename()).toMatch(/^Nota - Mercado das Flores - \d{2}-\d{2}-\d{4}\.pdf$/);
  const pdfPath = await pdf.path();
  expect(pdfPath).toBeTruthy();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toMatch(/^Olá, (bom dia|boa tarde|boa noite)! Tudo bem\?/);
  expect(clipboard).toContain("sua nota do pedido do dia ");
  expect(clipboard).toMatch(/Segue o link da nota para pagamento: http\S+\/c\/[0-9a-f-]{36}$/);
  expect(clipboard).not.toContain("R$");
  await expect(row("Pedido Lírios")).toHaveCount(0);
  await page.getByRole("button", { name: "Cobrança: todas" }).click();
  await expect(chargeSwitch("Pedido Lírios")).toHaveAttribute("aria-checked", "true");

  // 4) "Baixar cobranças (PDF)" exporta num ZIP só as vendas em aberto do filtro
  //    (a quitada fica de fora) e não mexe na marcação de cobrança.
  const zipDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar cobranças (PDF)" }).click();
  const zipFile = await zipDownload;
  expect(zipFile.suggestedFilename()).toMatch(
    /^Notas atacado - \d{4}-\d{2}-\d{2} a \d{4}-\d{2}-\d{2}\.zip$/,
  );
  const zip = await JSZip.loadAsync(readFileSync((await zipFile.path()) as string));
  const names = Object.keys(zip.files).sort();
  // Uma nota por pedido, nomeada pela data de entrega combinada.
  expect(names).toEqual([
    "Nota - Mercado das Flores - 15-10-2026.pdf",
    "Nota - Mercado das Flores - 16-10-2026.pdf",
  ]);
  for (const name of names) {
    const bytes = await zip.files[name].async("uint8array");
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
  }
  await expect(chargeSwitch("Pedido Rosas")).toHaveAttribute("aria-checked", "true");

  // Desmarcar devolve para "A cobrar".
  await chargeSwitch("Pedido Lírios").click();
  await expect(chargeSwitch("Pedido Lírios")).toHaveAttribute("aria-checked", "false");
});
