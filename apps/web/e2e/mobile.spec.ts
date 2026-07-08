import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

/**
 * Trava de responsividade mobile (viewport de celular, 390px). Garante que:
 *  - nenhuma página de lista estoura o layout horizontal;
 *  - nenhuma tabela precisa de rolagem lateral (colunas escondidas no mobile);
 *  - o botão de ação principal dos modais fica dentro da tela (rodapé fixo).
 */

const API = "http://localhost:3001/api";
const VIEWPORT = { width: 390, height: 844 };

const listPages = [
  "/inicio",
  "/clientes",
  "/financeiro",
  "/compras",
  "/estoque",
  "/despesas",
  "/eventos",
  "/caixa",
  "/orcamentos",
  "/insumos",
];

test.describe("responsividade mobile", () => {
  test("listas e tabelas cabem em 390px; modais com ação visível", async ({
    page,
  }) => {
    const stamp = Date.now();
    const email = `mobile_${stamp}@flores.com`;
    const password = "Segredo123!";
    await page.setViewportSize(VIEWPORT);

    // Cadastro
    await page.goto("/login");
    await page.getByRole("tab", { name: "Criar conta" }).click();
    await page.getByLabel("Nome da empresa").fill("Floricultura Bela Flor");
    await page.getByLabel("Seu nome").fill("Ana Souza");
    await page.getByLabel("CNPJ ou CPF").fill(String(Date.now()).padEnd(14, "0").slice(0, 14));
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Criar conta gratuita" }).click();
    await page.waitForURL(/\/inicio/);

    // Seed com nomes longos (piores casos de largura)
    const token = await firebaseIdToken(page.request, email, password);
    const auth = { Authorization: `Bearer ${token}` };
    const post = (path: string, data: object) =>
      page.request.post(`${API}${path}`, { headers: auth, data });

    const cust = await post("/customers", {
      name: "Maria Aparecida da Conceição Albuquerque",
      phone: "11912345678",
      document: "12345678901",
    });
    const custId = (await cust.json()).id;
    const sup = await post("/suppliers", {
      name: "Distribuidora de Flores e Folhagens Primavera LTDA",
      city: "São Paulo",
    });
    const supId = (await sup.json()).id;
    const cat = await post("/catalog/categories", { name: "Rosas Importadas" });
    const catId = (await cat.json()).id;
    await post("/catalog/products", {
      name: "Rosa Colombiana Vermelha Premium",
      categoryId: catId,
      unit: "UNIDADE",
      defaultPurchasePrice: 3.5,
      defaultSalePrice: 12.9,
      minStock: 10,
    });
    await post("/expenses", {
      description: "Aluguel da loja no centro comercial",
      costCenter: "Aluguel",
      amount: 3500,
      date: new Date().toISOString().slice(0, 10),
    });
    const sale = await post("/events/quick", { customerId: custId, amount: 250 });
    await post(`/finance/events/${(await sale.json()).id}/payments`, {
      amount: 100,
      method: "PIX",
    });
    await post("/purchases/quick", { supplierId: supId, amount: 800 });

    // 1) Sem overflow horizontal de página nem de tabela
    for (const path of listPages) {
      await page.goto(path);
      // Espera o gráfico do recharts assentar (evita overflow transiente na montagem).
      await page.waitForTimeout(800);
      const info = await page.evaluate(() => {
        const pageDiff =
          document.documentElement.scrollWidth - window.innerWidth;
        const worstTable = Array.from(document.querySelectorAll("table")).reduce(
          (max, t) => Math.max(max, t.scrollWidth - (t.parentElement?.clientWidth ?? 0)),
          0,
        );
        return { pageDiff, worstTable };
      });
      expect(info.pageDiff, `overflow de página em ${path}`).toBeLessThanOrEqual(1);
      expect(info.worstTable, `tabela larga em ${path}`).toBeLessThanOrEqual(1);
    }

    // 2) Modal: botão de ação principal inteiramente dentro do viewport (rodapé
    // fixo). toBeInViewport re-tenta até a animação de abertura assentar.
    await page.goto("/clientes");
    await page.getByRole("button", { name: "Novo cliente" }).first().click();
    const criar = page.getByRole("button", { name: "Criar cliente" });
    await expect(criar).toBeVisible();
    await expect(criar).toBeInViewport({ ratio: 1 });
    await page.keyboard.press("Escape");

    // Venda rápida: o rodapé NÃO é fixo (conteúdo é rei) — então o guard é que
    // o controle de Pagamento ("Já pago") apareça ao abrir (antes ficava
    // escondido sob o rodapé sticky) e que a ação seja alcançável rolando.
    await page.goto("/inicio");
    await page.getByRole("button", { name: "Nova venda" }).click();
    const jaPago = page.getByRole("button", { name: "Já pago", exact: true });
    await expect(jaPago).toBeVisible();
    await expect(jaPago).toBeInViewport({ ratio: 1 });
    const registrar = page.getByRole("button", { name: /Registrar venda/ });
    await registrar.scrollIntoViewIfNeeded();
    await expect(registrar).toBeInViewport();
  });
});
