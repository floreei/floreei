import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  Paginated,
  StoreBranding,
  StoreCatalog,
  StoreCatalogCategory,
  StoreCheckoutInput,
  StoreCheckoutResult,
  StoreOrder,
  StoreOrderItem,
  StoreOrderQuery,
  StoreReview,
  StoreReviewInput,
} from "@sistema-flores/types";
import {
  FEATURES,
  resolveCompanyAccess,
  resolveEntitlements,
} from "@sistema-flores/types";
import { decryptSecret } from "../../common/crypto/store-crypto";
import { roundMoney } from "../../common/money/money";
import { TenantContextService } from "../../common/tenant/tenant-context.service";
import { ArrangementRepository } from "../arrangements/infrastructure/arrangement.repository";
import { CompanyService } from "../companies/company.module";
import type { CompanyEntity } from "../companies/infrastructure/company.entity";
import { CustomerRepository } from "../customers/infrastructure/customer.repository";
import { EventsService } from "../events/application/events.service";
import { PlanDefinitionsService } from "../plans/plan-definitions.service";
import { ReviewsService } from "../reviews/application/reviews.service";
import { createPreference, getPayment } from "./mercadopago";
import { StoreOrderRepository } from "./infrastructure/store-order.repository";
import type { StoreOrderEntity } from "./infrastructure/store-order.entity";

@Injectable()
export class StorefrontService {
  constructor(
    private readonly companies: CompanyService,
    private readonly arrangements: ArrangementRepository,
    private readonly orders: StoreOrderRepository,
    private readonly customers: CustomerRepository,
    private readonly events: EventsService,
    private readonly tenant: TenantContextService,
    private readonly planDefs: PlanDefinitionsService,
    private readonly reviews: ReviewsService,
  ) {}

  /** Empresa da loja ativa, resolvida pelo slug. 404 se inexistente/desligada. */
  private async enabledCompany(slug: string): Promise<CompanyEntity> {
    const company = await this.companies.findBySlug(slug);
    if (!company || !company.storeEnabled) {
      throw new NotFoundException("Loja não encontrada.");
    }
    // A loja pública só funciona se o plano da empresa inclui a feature STORE.
    const status = resolveCompanyAccess({
      plan: company.plan,
      suspended: company.suspended,
      trialEndsAt: company.trialEndsAt,
      subscriptionStatus: company.subscriptionStatus,
      paymentFailedAt: company.paymentFailedAt,
    }).status;
    const features = resolveEntitlements(
      await this.planDefs.featuresOf(company.tier),
      company.featureOverrides,
      status,
    );
    if (!features.includes(FEATURES.STORE)) {
      throw new NotFoundException("Loja não encontrada.");
    }
    return company;
  }

  branding(slug: string): Promise<StoreBranding> {
    return this.enabledCompany(slug).then((c) => this.toBranding(c));
  }

  private toBranding(c: CompanyEntity): StoreBranding {
    return {
      slug: c.storeSlug ?? "",
      name: c.name,
      logo: c.logo,
      primaryColor: c.storePrimaryColor,
      accentColor: c.storeAccentColor,
      headline: c.storeHeadline,
      description: c.storeDescription,
      whatsapp: c.phone,
      mercadoPagoPublicKey: c.mpPublicKey,
    };
  }

  async catalog(slug: string): Promise<StoreCatalog> {
    const company = await this.enabledCompany(slug);
    return this.tenant.runForCompany(company.id, async () => {
      const rows = await this.arrangements.listPublished();
      const aggregates = await this.reviews.aggregates();
      const byArrangement = new Map(aggregates.map((a) => [a.arrangementId, a]));
      const byCategory = new Map<string, StoreCatalogCategory>();
      for (const a of rows) {
        const key = a.categoryId ?? "outros";
        const name = a.category?.name ?? "Outros";
        const group =
          byCategory.get(key) ??
          ({ id: a.categoryId, name, items: [] } as StoreCatalogCategory);
        const agg = byArrangement.get(a.id);
        group.items.push({
          id: a.id,
          name: a.name,
          imageUrl: a.imageUrl,
          price: a.salePrice,
          description: a.description ?? null,
          badge: a.badge ?? null,
          storeCategory: a.storeCategory ?? null,
          sizes: a.storeSizes ?? [],
          rating: agg ? Math.round(agg.avg * 10) / 10 : 0,
          reviews: agg?.count ?? 0,
        });
        byCategory.set(key, group);
      }
      return { categories: [...byCategory.values()] };
    });
  }

  /** Envio público de avaliação para um buquê publicado. */
  async submitReview(
    slug: string,
    arrangementId: string,
    input: StoreReviewInput,
  ): Promise<StoreReview> {
    const company = await this.enabledCompany(slug);
    return this.tenant.runForCompany(company.id, async () => {
      const arrangement =
        await this.arrangements.findPublishedById(arrangementId);
      if (!arrangement) {
        throw new NotFoundException("Buquê não encontrado nesta loja.");
      }
      return this.reviews.submit(arrangementId, input);
    });
  }

  /** Avaliações aprovadas de um buquê (loja pública). */
  async reviewsFor(slug: string, arrangementId: string): Promise<StoreReview[]> {
    const company = await this.enabledCompany(slug);
    return this.tenant.runForCompany(company.id, () =>
      this.reviews.listApproved(arrangementId),
    );
  }

  async checkout(
    slug: string,
    input: StoreCheckoutInput,
  ): Promise<StoreCheckoutResult> {
    const company = await this.enabledCompany(slug);
    if (!company.mpAccessToken) {
      throw new BadRequestException(
        "Esta loja ainda não configurou o pagamento.",
      );
    }
    const accessToken = decryptSecret(company.mpAccessToken);

    return this.tenant.runForCompany(company.id, async () => {
      // Recalcula tudo no servidor — nunca confia no preço vindo do cliente.
      const items: StoreOrderItem[] = [];
      for (const it of input.items) {
        const arr = await this.arrangements.findPublishedById(it.arrangementId);
        if (!arr) {
          throw new BadRequestException(
            "Um dos itens não está mais disponível.",
          );
        }
        // Aplica o acréscimo do tamanho escolhido (validado pela lista do buquê,
        // nunca pelo valor vindo do cliente).
        const size =
          it.sizeIndex != null ? arr.storeSizes?.[it.sizeIndex] : undefined;
        const unitPrice = roundMoney(arr.salePrice + (size?.priceDelta ?? 0));
        items.push({
          arrangementId: arr.id,
          name: size ? `${arr.name} (${size.label})` : arr.name,
          quantity: it.quantity,
          unitPrice,
          lineTotal: roundMoney(unitPrice * it.quantity),
        });
      }
      const total = roundMoney(items.reduce((s, i) => s + i.lineTotal, 0));
      if (total <= 0) {
        throw new BadRequestException("Pedido sem valor.");
      }

      const customer = await this.findOrCreateCustomer(input.customer);

      const order = await this.orders.save(
        this.orders.create({
          customerId: customer.id,
          customerName: input.customer.name,
          customerPhone: input.customer.phone,
          customerEmail: input.customer.email ?? null,
          deliveryAddress: input.customer.address ?? null,
          notes: input.notes ?? null,
          items,
          total,
          status: "PENDING",
        }),
      );

      const pref = await createPreference(accessToken, {
        items: items.map((i) => ({
          title: i.name,
          quantity: i.quantity,
          unit_price: i.unitPrice,
        })),
        externalReference: order.id,
        notificationUrl: `${this.apiPublicUrl()}/store/webhooks/mercadopago?company=${company.id}`,
        backUrls: {
          success: this.storeUrl(slug),
          failure: this.storeUrl(slug),
          pending: this.storeUrl(slug),
        },
        payerEmail: input.customer.email,
      });
      await this.orders.updateById(order.id, { mpPreferenceId: pref.id });

      return { orderId: order.id, paymentUrl: pref.initPoint };
    });
  }

  /**
   * Webhook do Mercado Pago. Confirma o pagamento consultando a API do MP
   * (autoritativo) e, se aprovado, cria a venda no ERP — idempotente.
   */
  async handleWebhook(companyId: string, paymentId: string): Promise<void> {
    if (!companyId || !paymentId) return;
    const company = await this.companies.findById(companyId);
    if (!company?.mpAccessToken) return;

    const accessToken = decryptSecret(company.mpAccessToken);
    const payment = await getPayment(accessToken, paymentId);
    if (
      !payment ||
      payment.status !== "approved" ||
      !payment.externalReference
    ) {
      return;
    }

    await this.tenant.runForCompany(company.id, async () => {
      const order = await this.orders.findById(payment.externalReference as string);
      if (!order || order.status === "PAID") return; // idempotência

      // Reusa o fluxo de venda do ERP: baixa de estoque + faturamento.
      const event = await this.events.quickSale({
        customerId: order.customerId ?? undefined,
        title: `Loja: ${order.customerName}`,
        channel: "RETAIL",
        items: order.items.map((i) => ({
          arrangementId: i.arrangementId,
          quantity: i.quantity,
          unitSalePrice: i.unitPrice,
        })),
      });

      await this.orders.updateById(order.id, {
        status: "PAID",
        mpPaymentId: paymentId,
        eventId: event.id,
      });
    });
  }

  /** Lista os pedidos da empresa (backoffice/ERP). */
  async listOrders(query: StoreOrderQuery): Promise<Paginated<StoreOrder>> {
    const page = await this.orders.search(query);
    return { ...page, data: page.data.map((o) => this.toOrder(o)) };
  }

  private toOrder(o: StoreOrderEntity): StoreOrder {
    return {
      id: o.id,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerEmail: o.customerEmail,
      deliveryAddress: o.deliveryAddress,
      notes: o.notes,
      items: o.items,
      total: o.total,
      status: o.status,
      eventId: o.eventId,
      createdAt:
        o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
    };
  }

  private async findOrCreateCustomer(c: StoreCheckoutInput["customer"]) {
    const existing = await this.customers.findByPhone(c.phone);
    if (existing) return existing;
    return this.customers.save(
      this.customers.create({
        name: c.name,
        phone: c.phone,
        whatsapp: c.phone,
        email: c.email ?? null,
        address: c.address ?? null,
      }),
    );
  }

  private apiPublicUrl(): string {
    return (
      process.env.STORE_PUBLIC_API_URL ??
      process.env.PUBLIC_API_URL ??
      "http://localhost:3001/api"
    );
  }

  private storeUrl(slug: string): string {
    const domain = process.env.STORE_BASE_DOMAIN ?? "floreei.com.br";
    return `https://${slug}.${domain}`;
  }
}
