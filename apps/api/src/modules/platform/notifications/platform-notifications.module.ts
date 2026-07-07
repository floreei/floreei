import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlatformNotificationEntity } from "../infrastructure/platform-notification.entity";
import { PlatformNotificationsService } from "./platform-notifications.service";

/**
 * Feed de notificações do console. Módulo enxuto (só a entidade) para que tanto
 * o AuthModule (cria no cadastro) quanto o PlatformModule (endpoints) usem o
 * serviço sem ciclo de dependência.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PlatformNotificationEntity])],
  providers: [PlatformNotificationsService],
  exports: [PlatformNotificationsService],
})
export class PlatformNotificationsModule {}
