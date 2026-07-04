import type { Role } from "@sistema-flores/types";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";
import { CompanyEntity } from "../../companies/infrastructure/company.entity";

/** Usuário do sistema, sempre vinculado a uma empresa (tenant). */
@Entity({ name: "users" })
@Index("uq_users_email", ["email"], { unique: true })
@Index("uq_users_firebase_uid", ["firebaseUid"], {
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

  @ManyToOne(() => CompanyEntity, (company) => company.users, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "company_id" })
  company!: CompanyEntity;
}
