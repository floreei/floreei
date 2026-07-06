import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { CommonModule } from "./common/common.module";
import { FirebaseModule } from "./common/firebase/firebase.module";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health/health.controller";
import { ArrangementsModule } from "./modules/arrangements/arrangements.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { CompanyModule } from "./modules/companies/company.module";
import { CustomerProfileModule } from "./modules/customer-profile/customer-profile.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { EventsModule } from "./modules/events/events.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { PlatformModule } from "./modules/platform/platform.module";
import { PurchasesModule } from "./modules/purchases/purchases.module";
import { QuotesModule } from "./modules/quotes/quotes.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { SearchModule } from "./modules/search/search.module";
import { StockModule } from "./modules/stock/stock.module";
import { SupplierProfileModule } from "./modules/supplier-profile/supplier-profile.module";
import { SuppliersModule } from "./modules/suppliers/suppliers.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    // Rate limiting (anti brute-force/DoS). Sem limite nos testes e2e (rajada).
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: process.env.NODE_ENV === "test" ? 100_000 : 100 },
    ]),
    DatabaseModule,
    FirebaseModule,
    CommonModule,
    AuthModule,
    CompanyModule,
    UsersModule,
    CustomersModule,
    CustomerProfileModule,
    CatalogModule,
    ArrangementsModule,
    QuotesModule,
    EventsModule,
    SuppliersModule,
    SupplierProfileModule,
    PurchasesModule,
    StockModule,
    ExpensesModule,
    FinanceModule,
    ReportsModule,
    SearchModule,
    DashboardModule,
    PlatformModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
