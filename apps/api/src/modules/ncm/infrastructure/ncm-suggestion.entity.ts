import { Column, Entity } from "typeorm";
import { BaseEntity } from "../../../common/database/base.entity";

/** Sugestão curada (sinônimo do florista → NCM) — sem FK pra `ncm`, dado global. */
@Entity({ name: "ncm_suggestions" })
export class NcmSuggestionEntity extends BaseEntity {
  @Column({ type: "varchar", length: 80 })
  term!: string;

  @Column({ name: "ncm_code", type: "varchar", length: 8 })
  ncmCode!: string;

  @Column({ type: "varchar", length: 160 })
  label!: string;

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder!: number;
}
