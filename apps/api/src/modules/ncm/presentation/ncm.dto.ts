import { ncmSearchQuerySchema } from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";

export class NcmSearchQueryDto extends createZodDto(ncmSearchQuerySchema) {}
