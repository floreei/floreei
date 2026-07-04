import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FirebaseAuthGuard } from "../../common/auth/firebase-auth.guard";
import { FirebaseTokenGuard } from "../../common/auth/firebase-token.guard";
import { RolesGuard } from "../../common/auth/roles.guard";
import { CompanyEntity } from "../companies/infrastructure/company.entity";
import { UserEntity } from "../users/infrastructure/user.entity";
import { AuthService } from "./application/auth.service";
import { AuthController } from "./presentation/auth.controller";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, CompanyEntity])],
  controllers: [AuthController],
  providers: [
    AuthService,
    FirebaseTokenGuard,
    { provide: APP_GUARD, useClass: FirebaseAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
