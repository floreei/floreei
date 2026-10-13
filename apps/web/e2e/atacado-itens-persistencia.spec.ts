import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

/** Hoje no fuso local, "AAAA-MM-DD" (mesma regra do app). */
const todayISO = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const localDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
/** "quarta-feira, 14/10/2026" — como o cabeçalho do dia nos insights. */
const longDay = (iso: string) =>
  `${new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(localDate(iso))}, ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(localDate(iso))}`;
/** "qua 14/10" — como no rótulo do checkbox de cada pedido. */
const shortDay = (iso: string) =>
  `${new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(localDate(iso)).replace(".", "")} ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(localDate(iso))}`;

test("atacado: itens expansíveis na listagem e filtros persistem ao voltar do detalhe", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `atkp_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Persistência");
  await page.getByLabel("Seu nome").fill("Bia");
  await page.getByLabel("CNPJ ou CPF").fill(String(stamp).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cat = await (
    await page.request.post(`${API}/categories`, { headers: auth, data: { name: "Girassóis" } })
  ).json();
  const prod = await (
    await page.request.post(`${API}/products`, {
      headers: auth,
      data: { name: "Girassol Gigante", categoryId: cat.id, unit: "MACO", defaultSalePrice: 40 },
    })
  ).json();
  const customer = await (
    await page.request.post(`${API}/customers`, {
      headers: auth,
      data: { name: "Mercado das Flores" },
    })
  ).json();
  // Pendente de entrega: 7 maços, entrega combinada para hoje.
  const today = todayISO();
  await page.request.post(`${API}/events/quick`, {
    headers: auth,
    data: {
      channel: "WHOLESALE",
      customerId: customer.id,
      deliveryDate: today,
      items: [{ productId: prod.id, quantity: 7, unitSalePrice: 35 }],
    },
  });

  await page.goto("/atacado");

  // 1) Linha expansível: itens visíveis sem abrir o detalhe.
  await page.getByRole("button", { name: "Ver itens" }).first().click();
  await expect(page.locator("table").getByText("Girassol Gigante")).toBeVisible();
  await expect(page.locator("table").getByText("7 Maço")).toBeVisible();

  // Já entregue: 4 maços para o mesmo cliente. Criada depois da conferência
  // da tabela (que segue com uma linha só); os insights só são buscados ao abrir.
  await page.request.post(`${API}/events/quick`, {
    headers: auth,
    data: {
      channel: "WHOLESALE",
      customerId: customer.id,
      delivered: true,
      items: [{ productId: prod.id, quantity: 4, unitSalePrice: 35 }],
    },
  });

  // 2) Insights com "Falta entregar" respeitando o período atual.
  await page.getByRole("button", { name: "Insights do período" }).click();
  const pendingTab = page.getByRole("tab", { name: /Falta entregar/ });
  const deliveredTab = page.getByRole("tab", { name: /Já entregue/ });
  // As duas contagens ficam visíveis nas abas, sem precisar clicar.
  await expect(pendingTab).toContainText("7 itens");
  await expect(deliveredTab).toContainText("4 itens");
  await expect(pendingTab).toHaveAttribute("aria-selected", "true");
  // O nome também aparece na tabela — o primeiro na DOM é o do painel de insights.
  await expect(page.getByText("Mercado das Flores").first()).toBeVisible();
  // Pedidos agrupados por dia, com o dia da semana por extenso no cabeçalho.
  await expect(page.getByText(longDay(today)).first()).toBeVisible();
  // Somatório por produto no rodapé da seção, com valor de venda.
  await expect(page.getByText("Total por produto")).toBeVisible();
  // O detalhamento por cliente tem o mesmo texto — basta um visível.
  // 7 maços × R$ 35 = R$ 245,00 (Intl usa espaço não separável após "R$").
  await expect(
    page.getByText(/7 maços — Girassol Gigante \(R\$\s245,00\)/).first(),
  ).toBeVisible();
  // Valor total de todos os pedidos pendentes no final da seção.
  const totalRow = page.locator("p", { hasText: "Valor total a entregar" });
  await expect(totalRow).toContainText("245,00");

  // Resumo por dia (o que vai para a rua): tipo, quantidade e dia, SEM preço.
  const summary = page.getByTestId("day-summary");
  await expect(summary).toContainText("7 maços de Girassol Gigante");
  await expect(summary).not.toContainText("R$");
  await expect(summary.getByRole("button", { name: "Copiar" })).toBeVisible();
  await expect(
    summary.getByRole("button", { name: "Imprimir / Salvar PDF" }),
  ).toBeVisible();

  // Desmarcar um pedido tira ele da contagem…
  const pendingOrder = `Incluir pedido de Mercado das Flores em ${shortDay(today)} na contagem`;
  await page.getByRole("checkbox", { name: pendingOrder }).uncheck();
  await expect(totalRow).toContainText("0,00");
  await expect(page.getByText("1 pedido fora da contagem")).toBeVisible();
  // …inclusive do resumo por dia, que some sem pedido marcado.
  await expect(page.getByTestId("day-summary")).toHaveCount(0);
  // …e marcar de novo devolve.
  await page.getByRole("checkbox", { name: pendingOrder }).check();
  await expect(totalRow).toContainText("245,00");

  // "Desmarcar todos" zera a contagem de uma vez e vira "Marcar todos".
  await page.getByRole("button", { name: "Desmarcar todos" }).click();
  await expect(totalRow).toContainText("0,00");
  await expect(pendingTab).toContainText("0 itens");
  await expect(page.getByRole("checkbox", { name: pendingOrder })).not.toBeChecked();
  await page.getByRole("button", { name: "Marcar todos" }).click();
  await expect(totalRow).toContainText("245,00");
  await expect(pendingTab).toContainText("7 itens");

  // Aba "Já entregue": mesma visão, só com o que já saiu (4 × R$ 35 = R$ 140).
  await deliveredTab.click();
  await expect(
    page.getByText(/4 maços — Girassol Gigante \(R\$\s140,00\)/).first(),
  ).toBeVisible();
  await expect(page.locator("p", { hasText: "Valor total entregue" })).toContainText(
    "140,00",
  );
  await expect(page.getByText("Valor total a entregar")).toHaveCount(0);

  // Aba "Total": pendentes + entregues (7 + 4 maços, R$ 245 + R$ 140). Os dois
  // pedidos do mesmo cliente seguem separados; só o "Total por produto" soma.
  const totalTab = page.getByRole("tab", { name: /^Total/ });
  await expect(totalTab).toContainText("11 itens");
  await totalTab.click();
  await expect(page.getByText("11 itens em 2 vendas")).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /Incluir pedido de Mercado das Flores/ }),
  ).toHaveCount(2);
  await expect(
    page.getByText(/11 maços — Girassol Gigante \(R\$\s385,00\)/),
  ).toBeVisible();
  await expect(
    page.locator("p", { hasText: "Valor total do período" }),
  ).toContainText("385,00");

  // 3) Filtro aplicado vai para a URL…
  await page.getByRole("button", { name: "A entregar" }).click();
  await expect(page).toHaveURL(/entrega=nao/);

  // …e sobrevive ao ir-e-voltar do detalhe (via menu de ações da linha).
  await page.getByRole("button", { name: "Ações da venda" }).first().click();
  await page.getByRole("menuitem", { name: "Ver detalhes" }).click();
  await page.waitForURL(/\/atacado\/[0-9a-f-]+/);
  await page.getByRole("button", { name: "Atacado" }).click();
  await expect(page).toHaveURL(/entrega=nao/);
  await expect(page.getByRole("button", { name: "Insights do período" })).toBeVisible();

  // 4) Marcar como paga direto na listagem, sem entrar no detalhe.
  await page.getByRole("button", { name: "Ações da venda" }).first().click();
  await page.getByRole("menuitem", { name: "Receber" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/Saldo em aberto/)).toBeVisible();
  await dialog.getByRole("button", { name: "Receber" }).click();
  await expect(page.locator("table").getByText("Pago")).toBeVisible();
});
