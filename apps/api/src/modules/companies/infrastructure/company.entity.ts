import type {
  CompanyPlan,
  FeatureOverrides,
  PlanTier,
  SubscriptionStatus,
} from "@sistema-flores/types";
import { Column, Entity, OneToMany } from "typeorm";
import { BaseEntity } from "../../../common/database/base.entity";
import { UserEntity } from "../../users/infrastructure/user.entity";

/** Empresa = tenant. Raiz do isolamento multi-tenant. */
@Entity({ name: "companies" })
export class CompanyEntity extends BaseEntity {
  @Column({ type: "varchar", length: 160 })
  name!: string;

  /** Plano de acesso: TRIAL (período gratuito) ou ACTIVE (liberada sem prazo). */
  @Column({ type: "varchar", length: 16, default: "TRIAL" })
  plan!: CompanyPlan;

  /** Primeiro acesso autenticado — dispara a contagem do trial. */
  @Column({ name: "first_access_at", type: "timestamptz", nullable: true })
  firstAccessAt!: Date | null;

  /** Fim do período gratuito (extensível pelo console). */
  @Column({ name: "trial_ends_at", type: "timestamptz", nullable: true })
  trialEndsAt!: Date | null;

  /** Bloqueio manual pelo gestor da plataforma (tem precedência sobre o plano). */
  @Column({ type: "boolean", default: false })
  suspended!: boolean;

  /** Último acesso autenticado de qualquer usuário da empresa (throttle ~1h). */
  @Column({ name: "last_seen_at", type: "timestamptz", nullable: true })
  lastSeenAt!: Date | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  document!: string | null;

  @Column({ type: "varchar", length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", length: 180, nullable: true })
  email!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  address!: string | null;

  /** Chave Pix (QR code de pagamento na nota da venda). */
  @Column({ name: "pix_key", type: "varchar", length: 140, nullable: true })
  pixKey!: string | null;

  @Column({ type: "text", nullable: true })
  logo!: string | null;

  // ── Loja online (storefront) ──────────────────────────────────────────────
  /** Endereço público da loja (subdomínio). Único entre empresas quando definido. */
  @Column({ name: "store_slug", type: "varchar", length: 40, nullable: true })
  storeSlug!: string | null;

  @Column({ name: "store_enabled", type: "boolean", default: false })
  storeEnabled!: boolean;

  @Column({ name: "store_primary_color", type: "varchar", length: 9, default: "#2F6050" })
  storePrimaryColor!: string;

  @Column({ name: "store_accent_color", type: "varchar", length: 9, default: "#C6795B" })
  storeAccentColor!: string;

  @Column({ name: "store_headline", type: "varchar", length: 160, nullable: true })
  storeHeadline!: string | null;

  @Column({ name: "store_description", type: "text", nullable: true })
  storeDescription!: string | null;

  /** Access token do Mercado Pago do lojista — SEGREDO, cifrado em repouso. */
  @Column({ name: "mp_access_token", type: "text", nullable: true })
  mpAccessToken!: string | null;

  /** Public key do Mercado Pago (pode ir ao browser). */
  @Column({ name: "mp_public_key", type: "varchar", length: 200, nullable: true })
  mpPublicKey!: string | null;

  // ── Fiscal (emissão de nota) ─────────────────────────────────────────────
  /** Inscrição Estadual (ou "ISENTO"). */
  @Column({ name: "state_registration", type: "varchar", length: 20, nullable: true })
  stateRegistration!: string | null;

  /** Regime tributário — texto livre (o provedor de NFe é quem interpreta). */
  @Column({ name: "tax_regime", type: "varchar", length: 20, nullable: true })
  taxRegime!: string | null;

  // Endereço fiscal ESTRUTURADO — diferente de `address` (texto livre, usado
  // no timbrado dos documentos impressos). O XML da nota exige campos separados.
  @Column({ name: "fiscal_address_street", type: "varchar", length: 160, nullable: true })
  fiscalAddressStreet!: string | null;

  @Column({ name: "fiscal_address_number", type: "varchar", length: 20, nullable: true })
  fiscalAddressNumber!: string | null;

  @Column({ name: "fiscal_address_complement", type: "varchar", length: 80, nullable: true })
  fiscalAddressComplement!: string | null;

  @Column({ name: "fiscal_address_neighborhood", type: "varchar", length: 80, nullable: true })
  fiscalAddressNeighborhood!: string | null;

  @Column({ name: "fiscal_address_city", type: "varchar", length: 80, nullable: true })
  fiscalAddressCity!: string | null;

  @Column({ name: "fiscal_address_state", type: "varchar", length: 2, nullable: true })
  fiscalAddressState!: string | null;

  @Column({ name: "fiscal_address_zip", type: "varchar", length: 9, nullable: true })
  fiscalAddressZip!: string | null;

  /** Código IBGE do município — exigido no XML da nota. */
  @Column({ name: "fiscal_city_code", type: "varchar", length: 7, nullable: true })
  fiscalCityCode!: string | null;

  /** Emitir a nota automaticamente ao fechar a venda (senão, é manual). */
  @Column({ name: "invoice_auto_emit", type: "boolean", default: false })
  invoiceAutoEmit!: boolean;

  // ── Plano de preço e features (entitlements) ────────────────────────────────
  /** Plano contratado (null = trial / sem assinatura). */
  @Column({ name: "tier", type: "varchar", length: 16, nullable: true })
  tier!: PlanTier | null;

  /** Overrides de feature definidos no backoffice (feature → on/off). */
  /** Override da cota de tokens do assistente (o "plus"); null = usa a do plano. */
  @Column({ name: "assistant_token_quota", type: "int", nullable: true })
  assistantTokenQuota!: number | null;

  @Column({ name: "feature_overrides", type: "jsonb", default: () => "'{}'" })
  featureOverrides!: FeatureOverrides;

  /** Vaga de fundador (permanente): 1ª assinatura autorizada ou marca manual. */
  @Column({ type: "boolean", default: false })
  founder!: boolean;

  /** Status da assinatura vigente (denormalizado do billing p/ o guard). */
  @Column({ name: "subscription_status", type: "varchar", length: 16, nullable: true })
  subscriptionStatus!: SubscriptionStatus | null;

  /** Início da pendência de pagamento — dispara a carência de 5 dias. */
  @Column({ name: "payment_failed_at", type: "timestamptz", nullable: true })
  paymentFailedAt!: Date | null;

  @OneToMany(() => UserEntity, (user) => user.company)
  users!: UserEntity[];
}
