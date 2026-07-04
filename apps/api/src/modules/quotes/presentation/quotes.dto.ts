import {
  quoteInputSchema,
  quoteQuerySchema,
  quoteStatusUpdateSchema,
} from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";

export class QuoteInputDto extends createZodDto(quoteInputSchema) {}
export class QuoteQueryDto extends createZodDto(quoteQuerySchema) {}
export class QuoteStatusUpdateDto extends createZodDto(quoteStatusUpdateSchema) {}
