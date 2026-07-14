import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CompanyEntity } from "../companies/infrastructure/company.entity";
import { StoreRevalidationService } from "./store-revalidation.service";

/**
 * Módulo leve com o serviço de invalidação de cache da vitrine. Importa só a
 * entidade da empresa (para resolver o slug pelo tenant) — sem depender de
 * CompanyModule/ArrangementsModule, evitando ciclos. Importado por quem escreve
 * dados da vitrine (arranjos, categorias, branding).
 */
@Module({
  imports: [TypeOrmModule.forFeature([CompanyEntity])],
  providers: [StoreRevalidationService],
  exports: [StoreRevalidationService],
})
export class StoreRevalidationModule {}
