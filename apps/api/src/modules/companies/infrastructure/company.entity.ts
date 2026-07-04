import { Column, Entity, OneToMany } from "typeorm";
import { BaseEntity } from "../../../common/database/base.entity";
import { UserEntity } from "../../users/infrastructure/user.entity";

/** Empresa = tenant. Raiz do isolamento multi-tenant. */
@Entity({ name: "companies" })
export class CompanyEntity extends BaseEntity {
  @Column({ type: "varchar", length: 160 })
  name!: string;

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

  @OneToMany(() => UserEntity, (user) => user.company)
  users!: UserEntity[];
}
