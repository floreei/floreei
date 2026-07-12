import type { DunningPaymentMethod, DunningStep } from "@sistema-flores/types";
import { Column, Entity, Index } from "typeorm";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";

/** Config da régua de cobrança — 1 por empresa. */
@Entity({ name: "dunning_settings" })
@Index("ux_dunning_settings_company", ["companyId"], { unique: true })
export class DunningSettingsEntity extends TenantOwnedEntity {
  @Column({ type: "boolean", default: false })
  enabled!: boolean;

  @Column({ type: "jsonb", default: () => "'[]'" })
  steps!: DunningStep[];

  @Column({ name: "payment_method", type: "varchar", length: 16, default: "NONE" })
  paymentMethod!: DunningPaymentMethod;

  @Column({ name: "pix_key", type: "varchar", length: 200, nullable: true })
  pixKey!: string | null;

  @Column({ name: "mp_link", type: "varchar", length: 500, nullable: true })
  mpLink!: string | null;

  @Column({ name: "extra_line", type: "varchar", length: 300, nullable: true })
  extraLine!: string | null;
}
