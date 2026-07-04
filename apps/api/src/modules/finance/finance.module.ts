import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Module,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  cashflowQuerySchema,
  cashInSchema,
  dreQuerySchema,
  monthlyCashflowQuerySchema,
  paymentInputSchema,
} from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { EventsModule } from "../events/events.module";
import { ExpensesModule } from "../expenses/expenses.module";
import { PurchasesModule } from "../purchases/purchases.module";
import { CashflowService } from "./application/cashflow.service";
import { DreService } from "./application/dre.service";
import { FinanceService } from "./application/finance.service";
import { PaymentsService } from "./application/payments.service";
import { PaymentEntity } from "./infrastructure/payment.entity";
import { PaymentRepository } from "./infrastructure/payment.repository";

class PaymentInputDto extends createZodDto(paymentInputSchema) {}
class DreQueryDto extends createZodDto(dreQuerySchema) {}
class CashflowQueryDto extends createZodDto(cashflowQuerySchema) {}
class MonthlyCashflowQueryDto extends createZodDto(monthlyCashflowQuerySchema) {}
class CashInDto extends createZodDto(cashInSchema) {}

@Controller("finance")
class FinanceController {
  constructor(
    private readonly finance: FinanceService,
    private readonly payments: PaymentsService,
    private readonly dre: DreService,
    private readonly cashflow: CashflowService,
  ) {}

  @Get("summary")
  summary() {
    return this.finance.summary();
  }

  @Get("dre")
  dreReport(@Query() query: DreQueryDto) {
    return this.dre.generate(query.from, query.to);
  }

  @Get("cashflow/monthly")
  monthlyCashflow(@Query() query: MonthlyCashflowQueryDto) {
    return this.cashflow.monthly(query.year);
  }

  @Get("cashflow")
  cashflowReport(@Query() query: CashflowQueryDto) {
    return this.cashflow.cashflow(query.from, query.to);
  }

  @Post("cash-in")
  cashIn(@Body() dto: CashInDto) {
    return this.cashflow.cashIn(dto);
  }

  @Post("events/:eventId/payments")
  receiveForEvent(
    @Param("eventId", ParseUUIDPipe) eventId: string,
    @Body() dto: PaymentInputDto,
  ) {
    return this.payments.receiveForEvent(eventId, dto);
  }

  @Get("events/:eventId/payments")
  eventPayments(@Param("eventId", ParseUUIDPipe) eventId: string) {
    return this.payments.listForEvent(eventId);
  }

  @Patch("events/:eventId/payments/:paymentId")
  updateEventPayment(
    @Param("eventId", ParseUUIDPipe) eventId: string,
    @Param("paymentId", ParseUUIDPipe) paymentId: string,
    @Body() dto: PaymentInputDto,
  ) {
    return this.payments.updateEventPayment(eventId, paymentId, dto);
  }

  @Delete("events/:eventId/payments/:paymentId")
  @HttpCode(204)
  removeEventPayment(
    @Param("eventId", ParseUUIDPipe) eventId: string,
    @Param("paymentId", ParseUUIDPipe) paymentId: string,
  ) {
    return this.payments.removeEventPayment(eventId, paymentId);
  }

  @Post("purchases/:purchaseId/payments")
  payForPurchase(
    @Param("purchaseId", ParseUUIDPipe) purchaseId: string,
    @Body() dto: PaymentInputDto,
  ) {
    return this.payments.payForPurchase(purchaseId, dto);
  }

  @Get("purchases/:purchaseId/payments")
  purchasePayments(@Param("purchaseId", ParseUUIDPipe) purchaseId: string) {
    return this.payments.listForPurchase(purchaseId);
  }

  @Patch("purchases/:purchaseId/payments/:paymentId")
  updatePurchasePayment(
    @Param("purchaseId", ParseUUIDPipe) purchaseId: string,
    @Param("paymentId", ParseUUIDPipe) paymentId: string,
    @Body() dto: PaymentInputDto,
  ) {
    return this.payments.updatePurchasePayment(purchaseId, paymentId, dto);
  }

  @Delete("purchases/:purchaseId/payments/:paymentId")
  @HttpCode(204)
  removePurchasePayment(
    @Param("purchaseId", ParseUUIDPipe) purchaseId: string,
    @Param("paymentId", ParseUUIDPipe) paymentId: string,
  ) {
    return this.payments.removePurchasePayment(purchaseId, paymentId);
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity]),
    EventsModule,
    PurchasesModule,
    ExpensesModule,
  ],
  controllers: [FinanceController],
  providers: [
    FinanceService,
    PaymentsService,
    DreService,
    CashflowService,
    PaymentRepository,
  ],
  exports: [PaymentRepository],
})
export class FinanceModule {}
