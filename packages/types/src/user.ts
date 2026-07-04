import { z } from "zod";
import { emailSchema } from "./common";
import { roleSchema } from "./enums";

/** Criação de um membro da equipe (feito por um administrador). */
export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(160),
  email: emailSchema,
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres").max(72),
  role: roleSchema.default("OPERATOR"),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

/** Atualização de um membro da equipe. */
export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  role: roleSchema.optional(),
  active: z.boolean().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
