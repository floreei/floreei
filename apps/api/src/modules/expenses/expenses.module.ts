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
import {
  expenseInputSchema,
  expenseQuerySchema,
  type ExpenseInput,
  type ExpenseQuery,
} from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { Roles } from "../../common/auth/roles.decorator";
import { ExpenseEntity } from "./infrastructure/expense.entity";
import { ExpenseRepository } from "./infrastructure/expense.repository";

class ExpenseInputDto extends createZodDto(expenseInputSchema) {}
class ExpenseQueryDto extends createZodDto(expenseQuerySchema) {}

@Injectable()
export class ExpensesService {
  constructor(private readonly expenses: ExpenseRepository) {}

  list(query: ExpenseQuery) {
    return this.expenses.search(query);
  }

  create(input: ExpenseInput) {
    return this.expenses.save(
      this.expenses.create({ ...input, notes: input.notes ?? null }),
    );
  }

  async update(id: string, input: ExpenseInput) {
    const expense = await this.expenses.findByIdOrFail(id);
    Object.assign(expense, { ...input, notes: input.notes ?? null });
    return this.expenses.save(expense);
  }

  remove(id: string) {
    return this.expenses.deleteById(id);
  }
}

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
  imports: [TypeOrmModule.forFeature([ExpenseEntity])],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpenseRepository],
  exports: [ExpenseRepository],
})
export class ExpensesModule {}
