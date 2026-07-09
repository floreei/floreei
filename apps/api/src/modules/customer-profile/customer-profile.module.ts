import {
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  ParseUUIDPipe,
} from "@nestjs/common";
import type {
  Customer,
  CustomerProfile,
  ProfileOrderItem,
} from "@sistema-flores/types";
import { roundMoney } from "../../common/money/money";
import {
  aggregateTopItems,
  bestMonth,
  monthlySeries,
} from "../../common/profile/profile-aggregations";
import { CustomersModule } from "../customers/customers.module";
import { CustomerEntity } from "../customers/infrastructure/customer.entity";
import { CustomerRepository } from "../customers/infrastructure/customer.repository";
import { EventsModule } from "../events/events.module";
import { EventRepository } from "../events/infrastructure/event.repository";
import { QuotesModule } from "../quotes/quotes.module";
import { QuoteRepository } from "../quotes/infrastructure/quote.repository";

function toCustomer(c: CustomerEntity): Customer {
  return {
    id: c.id,
    companyId: c.companyId,
    name: c.name,
    phone: c.phone,
    whatsapp: c.whatsapp,
    email: c.email,
    document: c.document,
    address: c.address,
    notes: c.notes,
    channel: c.channel,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
  };
}

@Injectable()
export class CustomerProfileService {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly events: EventRepository,
    private readonly quotes: QuoteRepository,
  ) {}

  async profile(id: string): Promise<CustomerProfile> {
    const customer = await this.customers.findByIdOrFail(id);

    const events = await this.events
      .qb("event")
      .leftJoinAndSelect("event.items", "eitem")
      .andWhere("event.customer_id = :id", { id })
      .orderBy("event.date", "DESC")
      .getMany();

    const quotes = await this.quotes
      .qb("quote")
      .andWhere("quote.customer_id = :id", { id })
      .orderBy("quote.number", "DESC")
      .getMany();

    const active = events.filter((e) => e.status !== "CANCELED");
    const totalSold = roundMoney(active.reduce((acc, e) => acc + e.soldValue, 0));
    const totalReceived = roundMoney(
      active.reduce((acc, e) => acc + e.receivedValue, 0),
    );

    const itemsOf = (e: (typeof events)[number]): ProfileOrderItem[] =>
      (e.items ?? []).map((it) => ({
        name: it.description,
        quantity: it.quantity,
        lineTotal: it.lineTotal,
      }));

    const monthly = monthlySeries(
      active.map((e) => ({ date: e.date, value: e.soldValue })),
    );

    return {
      customer: toCustomer(customer),
      stats: {
        eventsCount: events.length,
        totalSold,
        totalReceived,
        balanceDue: roundMoney(totalSold - totalReceived),
      },
      topItems: aggregateTopItems(active.flatMap(itemsOf)),
      monthly,
      bestMonth: bestMonth(monthly),
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        status: e.status,
        soldValue: e.soldValue,
        receivedValue: e.receivedValue,
        items: itemsOf(e),
      })),
      quotes: quotes.map((q) => ({
        id: q.id,
        number: q.number,
        status: q.status,
        totalSale: q.totalSale,
        createdAt:
          q.createdAt instanceof Date ? q.createdAt.toISOString() : q.createdAt,
      })),
    };
  }
}

@Controller("customers")
class CustomerProfileController {
  constructor(private readonly service: CustomerProfileService) {}

  @Get(":id/profile")
  profile(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.profile(id);
  }
}

@Module({
  imports: [CustomersModule, EventsModule, QuotesModule],
  controllers: [CustomerProfileController],
  providers: [CustomerProfileService],
})
export class CustomerProfileModule {}
