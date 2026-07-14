import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReviewsService } from "./application/reviews.service";
import { ReviewEntity } from "./infrastructure/review.entity";
import { ReviewRepository } from "./infrastructure/review.repository";
import { ReviewsController } from "./presentation/reviews.controller";

/**
 * Avaliações da loja online. A moderação (controller) é tenant-scoped; o envio
 * e a listagem públicos ficam no StorefrontModule, que importa este e reusa o
 * ReviewsService dentro de `tenant.runForCompany`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ReviewEntity])],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewRepository],
  exports: [ReviewsService, ReviewRepository],
})
export class ReviewsModule {}
