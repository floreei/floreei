import type { PlatformAdminRole } from "@sistema-flores/types";
import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../../common/database/base.entity";

/**
 * Gestor da plataforma (operador do SaaS). NÃO pertence a nenhuma empresa —
 * é uma identidade global que administra os tenants pelo console `/admin/*`.
 */
@Entity({ name: "platform_admins" })
@Index("uq_platform_admins_email", ["email"], { unique: true })
@Index("uq_platform_admins_firebase_uid", ["firebaseUid"], {
  unique: true,
  where: '"firebase_uid" IS NOT NULL',
})
export class PlatformAdminEntity extends BaseEntity {
  @Column({ type: "varchar", length: 180 })
  email!: string;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  /** UID no Firebase Auth (vinculado no primeiro login). */
  @Column({ name: "firebase_uid", type: "varchar", length: 128, nullable: true })
  firebaseUid!: string | null;

  @Column({ type: "varchar", length: 16, default: "SUPPORT" })
  role!: PlatformAdminRole;

  @Column({ type: "boolean", default: true })
  active!: boolean;
}
