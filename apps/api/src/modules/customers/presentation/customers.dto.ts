import { customerInputSchema, customerQuerySchema } from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";

export class CustomerInputDto extends createZodDto(customerInputSchema) {}
export class CustomerQueryDto extends createZodDto(customerQuerySchema) {}
