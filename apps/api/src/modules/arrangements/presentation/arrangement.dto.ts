import {
  arrangementInputSchema,
  arrangementQuerySchema,
} from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";

export class ArrangementInputDto extends createZodDto(arrangementInputSchema) {}
export class ArrangementQueryDto extends createZodDto(arrangementQuerySchema) {}
