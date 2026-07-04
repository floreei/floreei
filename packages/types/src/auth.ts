import { z } from "zod";
import { emailSchema, idSchema } from "./common";
import { roleSchema } from "./enums";

/** Cadastro self-service: cria a empresa + usuário administrador. */
export const registerSchema = z.object({
  companyName: z.string().trim().min(2, "Informe o nome da empresa").max(160),
  name: z.string().trim().min(2, "Informe seu nome").max(160),
  email: emailSchema,
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres").max(72),
});
export type RegisterInput = z.infer<typeof registerSchema>;

/** Autenticação por e-mail + senha (validação do formulário no cliente). */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Provisionamento da conta no backend após o cadastro no Firebase: o e-mail vem
 * do ID token verificado; aqui só informamos empresa + nome do administrador.
 */
export const provisionSchema = z.object({
  companyName: z.string().trim().min(2, "Informe o nome da empresa").max(160),
  name: z.string().trim().min(2, "Informe seu nome").max(160),
});
export type ProvisionInput = z.infer<typeof provisionSchema>;

/** Representação pública (sem segredos) de um usuário autenticado. */
export const publicUserSchema = z.object({
  id: idSchema,
  companyId: idSchema,
  companyName: z.string().optional(),
  name: z.string(),
  email: emailSchema,
  role: roleSchema,
});
export type PublicUser = z.infer<typeof publicUserSchema>;
