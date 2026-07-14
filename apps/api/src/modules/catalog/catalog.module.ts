import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StoreRevalidationModule } from "../storefront/store-revalidation.module";
import { CategoriesService } from "./application/categories.service";
import { ProductsService } from "./application/products.service";
import { CategoryEntity } from "./infrastructure/category.entity";
import { CategoryRepository } from "./infrastructure/category.repository";
import { ProductEntity } from "./infrastructure/product.entity";
import { ProductRepository } from "./infrastructure/product.repository";
import { CategoriesController } from "./presentation/categories.controller";
import { ProductsController } from "./presentation/products.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoryEntity, ProductEntity]),
    StoreRevalidationModule,
  ],
  controllers: [CategoriesController, ProductsController],
  providers: [
    CategoriesService,
    ProductsService,
    CategoryRepository,
    ProductRepository,
  ],
  exports: [ProductsService, ProductRepository, CategoryRepository],
})
export class CatalogModule {}
