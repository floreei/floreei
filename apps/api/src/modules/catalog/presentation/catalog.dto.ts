import {
  categoryInputSchema,
  productInputSchema,
  productQuerySchema,
} from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";

export class CategoryInputDto extends createZodDto(categoryInputSchema) {}
export class ProductInputDto extends createZodDto(productInputSchema) {}
export class ProductQueryDto extends createZodDto(productQuerySchema) {}
