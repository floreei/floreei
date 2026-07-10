import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * NCM — dado GLOBAL (não pertence a nenhum tenant), sincronizado do Portal
 * Único Siscomex. `code` é a chave primária (não usa BaseEntity — não tem
 * companyId nem id uuid próprio, o código de 8 dígitos já é único).
 */
@Entity({ name: "ncm" })
export class NcmEntity {
  @PrimaryColumn({ type: "varchar", length: 8 })
  code!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ name: "hierarchical_description", type: "text" })
  hierarchicalDescription!: string;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  @Column({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
