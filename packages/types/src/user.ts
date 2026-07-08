import { z } from "zod";
import { publicUserSchema } from "./auth";
import { emailSchema } from "./common";
import { roleSchema } from "./enums";

/**
 * Convite de um membro da equipe (feito por um administrador). Sem senha: o
 * convidado define a própria senha ao aceitar pelo link.
 */
export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(160),
  email: emailSchema,
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

/** Resultado de convidar: o membro criado + o link de convite pra compartilhar. */
export const inviteResultSchema = z.object({
  user: publicUserSchema,
  inviteUrl: z.string().url(),
});
export type InviteResult = z.infer<typeof inviteResultSchema>;

/** Dados públicos do convite, exibidos na tela de aceite (por token). */
export const inviteInfoSchema = z.object({
  email: z.string(),
  name: z.string(),
  companyName: z.string(),
});
export type InviteInfo = z.infer<typeof inviteInfoSchema>;

/** Aceite do convite: o convidado define a senha. */
export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres").max(72),
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
