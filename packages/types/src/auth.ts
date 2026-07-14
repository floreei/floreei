import { z } from "zod";
import { subscriptionStatuses } from "./billing";
import { documentSchema, emailSchema, idSchema } from "./common";
import { ALL_FEATURES, planTiers } from "./entitlements";
import { roleSchema } from "./enums";
import { companyAccessStatuses, companyPlans } from "./platform";

/** Cadastro self-service: cria a empresa + usuário administrador. */
export const registerSchema = z.object({
  companyName: z.string().trim().min(2, "Informe o nome da empresa").max(160),
  name: z.string().trim().min(2, "Informe seu nome").max(160),
  /** CNPJ ou CPF — trava trial repetido do mesmo negócio (um por documento). */
  document: documentSchema,
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
  /** CNPJ ou CPF do negócio (um cadastro por documento). */
  document: documentSchema,
});
export type ProvisionInput = z.infer<typeof provisionSchema>;

/** Situação de acesso da empresa do usuário (plano/trial), anexada ao perfil. */
export const companyAccessInfoSchema = z.object({
  plan: z.enum(companyPlans),
  status: z.enum(companyAccessStatuses),
  /** Dias restantes do período gratuito (quando em TRIAL); null caso contrário. */
  trialDaysLeft: z.number().nullable(),
  trialEndsAt: z.string().nullable(),
  /** Plano de preço contratado (null em trial / sem assinatura). */
  tier: z.enum(planTiers).nullable(),
  /** Status da assinatura recorrente; null sem assinatura. */
  subscriptionStatus: z.enum(subscriptionStatuses).nullable(),
  /** Dias restantes da carência quando há pagamento pendente; senão null. */
  graceDaysLeft: z.number().nullable(),
  /** Features liberadas para a empresa (resolvidas de tier + overrides + trial). */
  features: z.array(z.enum(ALL_FEATURES as [string, ...string[]])),
});
export type CompanyAccessInfo = z.infer<typeof companyAccessInfoSchema>;

/** Representação pública (sem segredos) de um usuário autenticado. */
export const publicUserSchema = z.object({
  id: idSchema,
  companyId: idSchema,
  companyName: z.string().optional(),
  name: z.string(),
  email: emailSchema,
  role: roleSchema,
  access: companyAccessInfoSchema.optional(),
  /** Convite ainda não aceito (sem login definido). */
  pending: z.boolean().optional(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;

/**
 * Uma das empresas às quais o e-mail autenticado tem acesso. Quando há mais de
 * uma, o cliente mostra um seletor de conta no login e envia a escolha no header
 * `x-company-id`.
 */
export interface AccountOption {
  companyId: string;
  companyName: string;
  role: z.infer<typeof roleSchema>;
}
