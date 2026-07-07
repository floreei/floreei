import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlanDefinitionEntity } from "./plan-definition.entity";
import { PlanDefinitionsService } from "./plan-definitions.service";

/**
 * Definições vigentes dos planos (preço + features), editáveis pelo console.
 * Global: o guard de auth, o billing, o storefront e o console consomem.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PlanDefinitionEntity])],
  providers: [PlanDefinitionsService],
  exports: [PlanDefinitionsService],
})
export class PlansModule {}
