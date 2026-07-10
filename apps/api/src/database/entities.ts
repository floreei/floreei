import { ArrangementItemEntity } from "../modules/arrangements/infrastructure/arrangement-item.entity";
import { ArrangementEntity } from "../modules/arrangements/infrastructure/arrangement.entity";
import { SubscriptionEntity } from "../modules/billing/infrastructure/subscription.entity";
import { PlanDefinitionEntity } from "../modules/plans/plan-definition.entity";
import { CategoryEntity } from "../modules/catalog/infrastructure/category.entity";
import { ProductEntity } from "../modules/catalog/infrastructure/product.entity";
import { CompanyEntity } from "../modules/companies/infrastructure/company.entity";
import { CustomerEntity } from "../modules/customers/infrastructure/customer.entity";
import { EventAttachmentEntity } from "../modules/events/infrastructure/event-attachment.entity";
import { EventItemEntity } from "../modules/events/infrastructure/event-item.entity";
import { EventEntity } from "../modules/events/infrastructure/event.entity";
import { ExpenseAttachmentEntity } from "../modules/expenses/infrastructure/expense-attachment.entity";
import { ExpenseEntity } from "../modules/expenses/infrastructure/expense.entity";
import { PaymentEntity } from "../modules/finance/infrastructure/payment.entity";
import { InvoiceEntity } from "../modules/invoices/infrastructure/invoice.entity";
import { NcmSuggestionEntity } from "../modules/ncm/infrastructure/ncm-suggestion.entity";
import { NcmEntity } from "../modules/ncm/infrastructure/ncm.entity";
import { PlatformAdminEntity } from "../modules/platform/infrastructure/platform-admin.entity";
import { PlatformNotificationEntity } from "../modules/platform/infrastructure/platform-notification.entity";
import { PurchaseAttachmentEntity } from "../modules/purchases/infrastructure/purchase-attachment.entity";
import { PurchaseItemEntity } from "../modules/purchases/infrastructure/purchase-item.entity";
import { PurchaseEntity } from "../modules/purchases/infrastructure/purchase.entity";
import { QuoteItemEntity } from "../modules/quotes/infrastructure/quote-item.entity";
import { QuoteEntity } from "../modules/quotes/infrastructure/quote.entity";
import { StockMovementEntity } from "../modules/stock/infrastructure/stock-movement.entity";
import { StoreOrderEntity } from "../modules/storefront/infrastructure/store-order.entity";
import { SupplierEntity } from "../modules/suppliers/infrastructure/supplier.entity";
import { UserEntity } from "../modules/users/infrastructure/user.entity";

/** Registro único de todas as entidades persistentes. */
export const entities = [
  CompanyEntity,
  UserEntity,
  CustomerEntity,
  CategoryEntity,
  ProductEntity,
  QuoteEntity,
  QuoteItemEntity,
  EventEntity,
  SupplierEntity,
  PurchaseEntity,
  PurchaseItemEntity,
  PaymentEntity,
  StockMovementEntity,
  ExpenseEntity,
  EventAttachmentEntity,
  PurchaseAttachmentEntity,
  EventItemEntity,
  ArrangementEntity,
  ArrangementItemEntity,
  ExpenseAttachmentEntity,
  PlatformAdminEntity,
  PlatformNotificationEntity,
  StoreOrderEntity,
  SubscriptionEntity,
  PlanDefinitionEntity,
  InvoiceEntity,
  NcmEntity,
  NcmSuggestionEntity,
];
