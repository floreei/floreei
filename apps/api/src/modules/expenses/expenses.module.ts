import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Module,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import type {
  Expense,
  ExpenseAttachment,
  ExpenseAttachmentInput,
  ExpenseInput,
  ExpenseQuery,
  Paginated,
  PayExpenseInput,
} from "@sistema-flores/types";
import {
  expenseAttachmentInputSchema,
  expenseInputSchema,
  expenseQuerySchema,
  payExpenseSchema,
} from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { RequiresFeature } from "../../common/auth/feature.guard";
import { Roles } from "../../common/auth/roles.decorator";
import { todayISO } from "../../common/date/today";
import {
  toExpense,
  toExpenseAttachment,
} from "./application/expense.mapper";
import { ExpenseAttachmentEntity } from "./infrastructure/expense-attachment.entity";
import { ExpenseAttachmentRepository } from "./infrastructure/expense-attachment.repository";
import { ExpenseEntity } from "./infrastructure/expense.entity";
import { ExpenseRepository } from "./infrastructure/expense.repository";

class ExpenseInputDto extends createZodDto(expenseInputSchema) {}
class ExpenseQueryDto extends createZodDto(expenseQuerySchema) {}
class PayExpenseDto extends createZodDto(payExpenseSchema) {}
class ExpenseAttachmentDto extends createZodDto(expenseAttachmentInputSchema) {}

@Injectable()
export class ExpensesService {
  constructor(
    private readonly expenses: ExpenseRepository,
    private readonly attachments: ExpenseAttachmentRepository,
  ) {}

  async list(query: ExpenseQuery): Promise<Paginated<Expense>> {
    const page = await this.expenses.search(query);
    const atts = await this.attachments.listForExpenses(
      page.data.map((e) => e.id),
    );
    const byExpense = new Map<string, ExpenseAttachmentEntity[]>();
    for (const a of atts) {
      const list = byExpense.get(a.expenseId) ?? [];
      list.push(a);
      byExpense.set(a.expenseId, list);
    }
    return {
      ...page,
      data: page.data.map((e) => toExpense(e, byExpense.get(e.id) ?? [])),
    };
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expenses.findByIdOrFail(id);
    return toExpense(expense, await this.attachments.listForExpense(id));
  }

  async create(input: ExpenseInput): Promise<Expense> {
    const saved = await this.expenses.save(
      this.expenses.create({
        description: input.description,
        costCenter: input.costCenter,
        amount: input.amount,
        dueDate: input.dueDate,
        recurring: input.recurring,
        notes: input.notes ?? null,
        paid: false,
        paidDate: null,
        paymentMethod: null,
      }),
    );
    return this.findOne(saved.id);
  }

  async update(id: string, input: ExpenseInput): Promise<Expense> {
    const expense = await this.expenses.findByIdOrFail(id);
    Object.assign(expense, {
      description: input.description,
      costCenter: input.costCenter,
      amount: input.amount,
      dueDate: input.dueDate,
      recurring: input.recurring,
      notes: input.notes ?? null,
    });
    await this.expenses.save(expense);
    return this.findOne(id);
  }

  /** Marca como paga (data + método) e opcionalmente anexa o comprovante. */
  async pay(id: string, input: PayExpenseInput): Promise<Expense> {
    const expense = await this.expenses.findByIdOrFail(id);
    expense.paid = true;
    expense.paidDate = input.paidDate ?? todayISO();
    expense.paymentMethod = input.paymentMethod;
    await this.expenses.save(expense);
    if (input.receipt) {
      await this.addAttachment(id, { ...input.receipt, kind: "RECEIPT" });
    }
    return this.findOne(id);
  }

  /** Desfaz o pagamento (volta para "a pagar"). */
  async unpay(id: string): Promise<Expense> {
    const expense = await this.expenses.findByIdOrFail(id);
    expense.paid = false;
    expense.paidDate = null;
    expense.paymentMethod = null;
    await this.expenses.save(expense);
    return this.findOne(id);
  }

  remove(id: string): Promise<void> {
    return this.expenses.deleteById(id);
  }

  // --- Anexos (conta / comprovante) ------------------------------------------
  async listAttachments(expenseId: string): Promise<ExpenseAttachment[]> {
    await this.expenses.findByIdOrFail(expenseId);
    return (await this.attachments.listForExpense(expenseId)).map(
      toExpenseAttachment,
    );
  }

  async addAttachment(
    expenseId: string,
    input: ExpenseAttachmentInput,
  ): Promise<ExpenseAttachment> {
    await this.expenses.findByIdOrFail(expenseId);
    const saved = await this.attachments.save(
      this.attachments.create({
        expenseId,
        label: input.label,
        url: input.url,
        kind: input.kind,
        contentType: input.contentType ?? null,
      }),
    );
    return toExpenseAttachment(saved);
  }

  async removeAttachment(attachmentId: string): Promise<void> {
    await this.attachments.findByIdOrFail(attachmentId);
    await this.attachments.deleteById(attachmentId);
  }
}

@RequiresFeature("FINANCE")
@Controller("expenses")
class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  list(@Query() query: ExpenseQueryDto) {
    return this.expenses.list(query);
  }

  @Post()
  create(@Body() dto: ExpenseInputDto) {
    return this.expenses.create(dto);
  }

  @Delete("attachments/:attachmentId")
  @HttpCode(204)
  removeAttachment(
    @Param("attachmentId", ParseUUIDPipe) attachmentId: string,
  ) {
    return this.expenses.removeAttachment(attachmentId);
  }

  @Get(":id/attachments")
  listAttachments(@Param("id", ParseUUIDPipe) id: string) {
    return this.expenses.listAttachments(id);
  }

  @Post(":id/attachments")
  addAttachment(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ExpenseAttachmentDto,
  ) {
    return this.expenses.addAttachment(id, dto);
  }

  @Post(":id/pay")
  pay(@Param("id", ParseUUIDPipe) id: string, @Body() dto: PayExpenseDto) {
    return this.expenses.pay(id, dto);
  }

  @Post(":id/unpay")
  unpay(@Param("id", ParseUUIDPipe) id: string) {
    return this.expenses.unpay(id);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: ExpenseInputDto) {
    return this.expenses.update(id, dto);
  }

  @Roles("ADMIN")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.expenses.remove(id);
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([ExpenseEntity, ExpenseAttachmentEntity]),
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpenseRepository, ExpenseAttachmentRepository],
  exports: [ExpensesService, ExpenseRepository],
})
export class ExpensesModule {}
