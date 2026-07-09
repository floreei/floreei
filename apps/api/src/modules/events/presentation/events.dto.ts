import {
  convertQuoteSchema,
  eventInputSchema,
  eventQuerySchema,
  eventUpdateSchema,
  invoiceCancelSchema,
} from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";

export class EventInputDto extends createZodDto(eventInputSchema) {}
export class EventUpdateDto extends createZodDto(eventUpdateSchema) {}
export class EventQueryDto extends createZodDto(eventQuerySchema) {}
export class ConvertQuoteDto extends createZodDto(convertQuoteSchema) {}
export class InvoiceCancelDto extends createZodDto(invoiceCancelSchema) {}
