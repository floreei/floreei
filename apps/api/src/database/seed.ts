import "reflect-metadata";
import { firebaseWebApiKey } from "../common/firebase/firebase-options";
import { FirebaseService } from "../common/firebase/firebase.service";
import { calculateItem, calculateQuote } from "../modules/quotes/domain/quote-calculator";
import { CategoryEntity } from "../modules/catalog/infrastructure/category.entity";
import { ProductEntity } from "../modules/catalog/infrastructure/product.entity";
import { CompanyEntity } from "../modules/companies/infrastructure/company.entity";
import { CustomerEntity } from "../modules/customers/infrastructure/customer.entity";
import { EventEntity } from "../modules/events/infrastructure/event.entity";
import { ExpenseEntity } from "../modules/expenses/infrastructure/expense.entity";
import { PaymentEntity } from "../modules/finance/infrastructure/payment.entity";
import { StockMovementEntity } from "../modules/stock/infrastructure/stock-movement.entity";
import { PurchaseItemEntity } from "../modules/purchases/infrastructure/purchase-item.entity";
import { PurchaseEntity } from "../modules/purchases/infrastructure/purchase.entity";
import { QuoteItemEntity } from "../modules/quotes/infrastructure/quote-item.entity";
import { QuoteEntity } from "../modules/quotes/infrastructure/quote.entity";
import { SupplierEntity } from "../modules/suppliers/infrastructure/supplier.entity";
import { UserEntity } from "../modules/users/infrastructure/user.entity";
import { roundMoney } from "../common/money/money";
import dataSource from "./data-source";

const DEMO_EMAIL = "demo@flores.com";
// O projeto real exige senha forte (maiúscula + símbolo).
const DEMO_PASSWORD = "Demo123!flores";

/**
 * Garante a conta demo no Firebase Auth (projeto real, sem emulador) e devolve o
 * UID. Usa o Admin SDK quando há service account; senão, o Identity Toolkit REST
 * (via `FirebaseService.createAuthUser`). Se a conta já existe, autentica para
 * recuperar o uid.
 */
async function ensureFirebaseUser(
  email: string,
  password: string,
): Promise<string> {
  const firebase = new FirebaseService();
  try {
    return (await firebase.createAuthUser({ email, password })).uid;
  } catch (error) {
    if ((error as { code?: string }).code !== "auth/email-already-exists") {
      throw error;
    }
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseWebApiKey()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      },
    );
    const data = (await res.json()) as { localId?: string };
    if (!data.localId) {
      throw new Error(`Não foi possível recuperar o uid demo (${email}).`);
    }
    return data.localId;
  }
}

const catalog: Record<string, Array<[string, number, number]>> = {
  Rosas: [
    ["Rosa Vermelha", 4, 9],
    ["Rosa Branca", 4, 9],
    ["Rosa Cor-de-rosa", 4.5, 10],
  ],
  Hortênsias: [
    ["Hortênsia Azul", 12.5, 30],
    ["Hortênsia Branca", 12.5, 30],
  ],
  Gipsofilas: [["Gipsofila", 6, 14]],
  Lírios: [["Lírio Branco", 8, 18]],
  Orquídeas: [["Orquídea Phalaenopsis", 35, 75]],
  Folhagens: [
    ["Eucalipto", 5, 12],
    ["Folha de Palmeira", 3, 8],
  ],
};

async function run(): Promise<void> {
  await dataSource.initialize();
  await dataSource.runMigrations();

  const users = dataSource.getRepository(UserEntity);
  if (await users.findOne({ where: { email: DEMO_EMAIL } })) {
    // eslint-disable-next-line no-console
    console.log("Seed já aplicado (usuário demo existe). Nada a fazer.");
    await dataSource.destroy();
    return;
  }

  const company = await dataSource
    .getRepository(CompanyEntity)
    .save(
      dataSource
        .getRepository(CompanyEntity)
        .create({ name: "Floricultura Demo", document: "12345678000190" }),
    );
  const companyId = company.id;

  const firebaseUid = await ensureFirebaseUser(DEMO_EMAIL, DEMO_PASSWORD);
  await users.save(
    users.create({
      companyId,
      name: "Administrador Demo",
      email: DEMO_EMAIL,
      firebaseUid,
      role: "ADMIN",
      active: true,
    }),
  );

  const categoryRepo = dataSource.getRepository(CategoryEntity);
  const productRepo = dataSource.getRepository(ProductEntity);
  const productsByName = new Map<string, ProductEntity>();

  for (const [categoryName, products] of Object.entries(catalog)) {
    const category = await categoryRepo.save(
      categoryRepo.create({ companyId, name: categoryName }),
    );
    for (const [name, purchase, sale] of products) {
      const product = await productRepo.save(
        productRepo.create({
          companyId,
          categoryId: category.id,
          name,
          unit: "MACO",
          defaultPurchasePrice: purchase,
          defaultSalePrice: sale,
          currentUnitCost: purchase,
          active: true,
        }),
      );
      productsByName.set(name, product);
    }
  }

  const customerRepo = dataSource.getRepository(CustomerEntity);
  const ana = await customerRepo.save(
    customerRepo.create({
      companyId,
      name: "Ana e Pedro",
      whatsapp: "11999990001",
      email: "ana.pedro@email.com",
    }),
  );
  await customerRepo.save(
    customerRepo.create({
      companyId,
      name: "Buffet Jardim Secreto",
      whatsapp: "11999990002",
    }),
  );

  // Um orçamento de exemplo com itens calculados.
  const itemInputs = [
    { product: "Hortênsia Azul", quantity: 10 },
    { product: "Rosa Vermelha", quantity: 20 },
    { product: "Eucalipto", quantity: 8 },
  ].map(({ product, quantity }) => {
    const p = productsByName.get(product)!;
    return {
      productId: p.id,
      description: p.name,
      unit: p.unit,
      quantity,
      purchasePrice: p.defaultPurchasePrice,
      salePrice: p.defaultSalePrice,
    };
  });

  const totals = calculateQuote(itemInputs);
  const quoteRepo = dataSource.getRepository(QuoteEntity);
  const quote = await quoteRepo.save(
    quoteRepo.create({
      companyId,
      number: 1,
      customerId: ana.id,
      status: "SENT",
      notes: "Decoração de cerimônia e recepção.",
      items: itemInputs.map((input) => {
        const item = new QuoteItemEntity();
        Object.assign(item, { ...input, ...calculateItem(input) });
        return item;
      }),
      ...totals,
    }),
  );

  // Um evento confirmado para o mês atual, com metade já recebida (via baixa).
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const eventDate = `${ym}-20`;
  const received = roundMoney(totals.totalSale / 2);
  const event = await dataSource.getRepository(EventEntity).save(
    dataSource.getRepository(EventEntity).create({
      companyId,
      customerId: ana.id,
      quoteId: quote.id,
      title: "Casamento Ana e Pedro",
      date: eventDate,
      location: "Espaço Jardim Secreto",
      status: "CONFIRMED",
      soldValue: totals.totalSale,
      estimatedProfit: totals.totalProfit,
      receivedValue: received,
    }),
  );

  // Um fornecedor + uma compra (parcialmente paga) → contas a pagar e custo.
  const supplier = await dataSource.getRepository(SupplierEntity).save(
    dataSource.getRepository(SupplierEntity).create({
      companyId,
      name: "Ceasa Flores",
      city: "São Paulo",
      whatsapp: "11988880000",
      paymentTerms: "30 dias",
    }),
  );

  // Estoque mínimo para demonstrar alerta de estoque baixo.
  const rosa = productsByName.get("Rosa Vermelha");
  if (rosa) {
    await productRepo.update(rosa.id, { minStock: 40 });
  }

  const purchaseItems = [
    { description: "Rosa Vermelha", quantity: 30, unitPrice: 4 },
    { description: "Hortênsia Azul", quantity: 12, unitPrice: 12.5 },
  ];
  const itemsTotal = roundMoney(
    purchaseItems.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0),
  );
  const freight = 25;
  const purchaseTotal = roundMoney(itemsTotal + freight);
  const purchasePaid = roundMoney(purchaseTotal / 2);

  await dataSource.getRepository(PurchaseEntity).save(
    dataSource.getRepository(PurchaseEntity).create({
      companyId,
      supplierId: supplier.id,
      date: `${ym}-05`,
      status: "RECEIVED",
      freight,
      itemsTotal,
      total: purchaseTotal,
      paidAmount: purchasePaid,
      items: purchaseItems.map((i) => {
        const item = new PurchaseItemEntity();
        Object.assign(item, {
          description: i.description,
          quantity: i.quantity,
          unit: "MACO",
          unitPrice: i.unitPrice,
          lineTotal: roundMoney(i.quantity * i.unitPrice),
        });
        return item;
      }),
    }),
  );

  // Entradas de estoque correspondentes aos itens comprados.
  const stockRepo = dataSource.getRepository(StockMovementEntity);
  const stockEntries = purchaseItems
    .map((i) => productsByName.get(i.description))
    .filter((p): p is ProductEntity => Boolean(p))
    .map((product, idx) =>
      stockRepo.create({
        companyId,
        productId: product.id,
        type: "ENTRADA",
        source: "PURCHASE",
        quantity: purchaseItems[idx].quantity,
        date: `${ym}-05`,
      }),
    );
  if (stockEntries.length > 0) await stockRepo.save(stockEntries);

  // Lançamentos no livro-caixa do mês.
  const paymentRepo = dataSource.getRepository(PaymentEntity);
  await paymentRepo.save([
    paymentRepo.create({
      companyId,
      direction: "IN",
      eventId: event.id,
      amount: received,
      date: `${ym}-21`,
      method: "PIX",
    }),
    paymentRepo.create({
      companyId,
      direction: "OUT",
      amount: purchasePaid,
      date: `${ym}-06`,
      method: "PIX",
    }),
  ]);

  // Despesas operacionais do mês (entram na DRE).
  const expenseRepo = dataSource.getRepository(ExpenseEntity);
  await expenseRepo.save([
    expenseRepo.create({
      companyId,
      description: "Aluguel do ateliê",
      costCenter: "Aluguel",
      amount: 1800,
      dueDate: `${ym}-05`,
      paid: true,
      paidDate: `${ym}-05`,
      paymentMethod: "PIX",
      recurring: true,
    }),
    expenseRepo.create({
      companyId,
      description: "Combustível das entregas",
      costCenter: "Transporte",
      amount: 320,
      dueDate: `${ym}-12`,
      paid: false,
    }),
  ]);

  // eslint-disable-next-line no-console
  console.log(
    `Seed concluído. Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD} (empresa ${company.name}).`,
  );
  await dataSource.destroy();
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Falha no seed:", error);
  process.exit(1);
});
