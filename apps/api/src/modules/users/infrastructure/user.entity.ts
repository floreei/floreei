import type { Role } from "@sistema-flores/types";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";
import { CompanyEntity } from "../../companies/infrastructure/company.entity";

/** Usuário do sistema, sempre vinculado a uma empresa (tenant). */
// Unicidade POR EMPRESA: o mesmo e-mail/firebaseUid pode pertencer a várias
// empresas (login multi-conta) — o vínculo é único dentro de cada empresa.
@Entity({ name: "users" })
@Index("uq_users_company_email", ["companyId", "email"], { unique: true })
@Index("uq_users_company_firebase_uid", ["companyId", "firebaseUid"], {
  unique: true,
  where: '"firebase_uid" IS NOT NULL',
})
export class UserEntity extends TenantOwnedEntity {
  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ type: "varchar", length: 180 })
  email!: string;

  /** UID do usuário no Firebase Auth (fonte da identidade/credenciais). */
  @Column({ name: "firebase_uid", type: "varchar", length: 128, nullable: true })
  firebaseUid!: string | null;

  @Column({ type: "varchar", length: 16, default: "OPERATOR" })
  role!: Role;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  /** Token do convite pendente (link de aceite); null após o aceite. */
  @Column({ name: "invite_token", type: "varchar", length: 64, nullable: true })
  inviteToken!: string | null;

  @ManyToOne(() => CompanyEntity, (company) => company.users, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "company_id" })
  company!: CompanyEntity;
}
