import { Module } from "@nestjs/common";
import { EventsModule } from "../events/events.module";
import { QuotesModule } from "../quotes/quotes.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [EventsModule, QuotesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
