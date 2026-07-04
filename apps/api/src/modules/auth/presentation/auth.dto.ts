import { provisionSchema } from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";

export class ProvisionDto extends createZodDto(provisionSchema) {}
