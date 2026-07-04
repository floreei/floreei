import { Injectable } from "@nestjs/common";
import type { SearchResult } from "@sistema-flores/types";
import { CustomerRepository } from "../customers/infrastructure/customer.repository";
import { ProductRepository } from "../catalog/infrastructure/product.repository";
import { EventRepository } from "../events/infrastructure/event.repository";
import { PurchaseRepository } from "../purchases/infrastructure/purchase.repository";
import { QuoteRepository } from "../quotes/infrastructure/quote.repository";
import { SupplierRepository } from "../suppliers/infrastructure/supplier.repository";

@Injectable()
export class SearchService {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly events: EventRepository,
    private readonly quotes: QuoteRepository,
    private readonly products: ProductRepository,
    private readonly suppliers: SupplierRepository,
    private readonly purchases: PurchaseRepository,
  ) {}

  async search(q: string): Promise<SearchResult[]> {
    const like = `%${q}%`;
    const results: SearchResult[] = [];

    const events = await this.events
      .qb("event")
      .leftJoinAndSelect("event.customer", "customer")
      .andWhere("(event.title ILIKE :q OR customer.name ILIKE :q)", { q: like })
      .orderBy("event.date", "DESC")
      .limit(5)
      .getMany();
    for (const e of events) {
      results.push({
        id: e.id,
        type: "event",
        label: e.title,
        sublabel: e.customer?.name,
        href: `/eventos/${e.id}`,
      });
    }

    const quotes = await this.quotes
      .qb("quote")
      .leftJoinAndSelect("quote.customer", "customer")
      .andWhere("(CAST(quote.number AS TEXT) ILIKE :q OR customer.name ILIKE :q)", {
        q: like,
      })
      .orderBy("quote.number", "DESC")
      .limit(5)
      .getMany();
    for (const quote of quotes) {
      results.push({
        id: quote.id,
        type: "quote",
        label: `Orçamento #${quote.number}`,
        sublabel: quote.customer?.name,
        href: `/orcamentos/${quote.id}`,
      });
    }

    const customers = await this.customers
      .qb("customer")
      .andWhere(
        "(customer.name ILIKE :q OR customer.phone ILIKE :q OR customer.whatsapp ILIKE :q OR customer.email ILIKE :q OR customer.document ILIKE :q)",
        { q: like },
      )
      .orderBy("customer.name", "ASC")
      .limit(5)
      .getMany();
    for (const c of customers) {
      results.push({
        id: c.id,
        type: "customer",
        label: c.name,
        sublabel: c.whatsapp ?? c.phone ?? c.email ?? undefined,
        href: `/clientes/${c.id}`,
      });
    }

    const products = await this.products
      .qb("product")
      .leftJoinAndSelect("product.category", "category")
      .andWhere("product.name ILIKE :q", { q: like })
      .orderBy("product.name", "ASC")
      .limit(5)
      .getMany();
    for (const p of products) {
      results.push({
        id: p.id,
        type: "product",
        label: p.name,
        sublabel: p.category?.name,
        href: "/catalogo",
      });
    }

    const suppliers = await this.suppliers
      .qb("supplier")
      .andWhere("(supplier.name ILIKE :q OR supplier.city ILIKE :q)", { q: like })
      .orderBy("supplier.name", "ASC")
      .limit(5)
      .getMany();
    for (const s of suppliers) {
      results.push({
        id: s.id,
        type: "supplier",
        label: s.name,
        sublabel: s.city ?? undefined,
        href: `/fornecedores/${s.id}`,
      });
    }

    const purchases = await this.purchases
      .qb("purchase")
      .leftJoinAndSelect("purchase.supplier", "supplier")
      .andWhere("supplier.name ILIKE :q", { q: like })
      .orderBy("purchase.date", "DESC")
      .limit(5)
      .getMany();
    for (const purchase of purchases) {
      results.push({
        id: purchase.id,
        type: "purchase",
        label: `Compra · ${purchase.supplier?.name ?? ""}`.trim(),
        sublabel: purchase.date,
        href: "/compras",
      });
    }

    return results;
  }
}
