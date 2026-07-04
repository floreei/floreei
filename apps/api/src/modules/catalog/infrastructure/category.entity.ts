import { Column, Entity, Index, OneToMany } from "typeorm";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";
import { ProductEntity } from "./product.entity";

/** Categoria do catálogo (ex.: Rosas, Hortênsias, Folhagens). */
@Entity({ name: "categories" })
@Index("uq_categories_company_name", ["companyId", "name"], { unique: true })
export class CategoryEntity extends TenantOwnedEntity {
  @Column({ type: "varchar", length: 120 })
  name!: string;

  @OneToMany(() => ProductEntity, (product) => product.category)
  products!: ProductEntity[];
}
