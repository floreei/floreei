import type {
  CompanyPlan,
  FeatureOverrides,
  PlanTier,
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

  // ── Plano de preço e features (entitlements) ────────────────────────────────
  /** Plano contratado (null = trial / sem assinatura). */
  @Column({ name: "tier", type: "varchar", length: 16, nullable: true })
  tier!: PlanTier | null;

  /** Overrides de feature definidos no backoffice (feature → on/off). */
  @Column({ name: "feature_overrides", type: "jsonb", default: () => "'{}'" })
  featureOverrides!: FeatureOverrides;

  @OneToMany(() => UserEntity, (user) => user.company)
  users!: UserEntity[];
}
