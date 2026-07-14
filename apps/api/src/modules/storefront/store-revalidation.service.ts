import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TenantContextService } from "../../common/tenant/tenant-context.service";
import { CompanyEntity } from "../companies/infrastructure/company.entity";

/**
 * Dispara a invalidação do cache da vitrine (storefront) quando algo muda no
 * painel — buquês, categorias ou branding. Faz um POST fire-and-forget para o
 * endpoint `/api/revalidate` do front (ver `STORE_REVALIDATE_URL`), que chama
 * `revalidateTag`. Erros nunca quebram a escrita no ERP.
 */
@Injectable()
export class StoreRevalidationService {
  private readonly logger = new Logger(StoreRevalidationService.name);

  constructor(
    private readonly tenant: TenantContextService,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
  ) {}

  /** Purga a vitrine da empresa do contexto atual (resolve o slug pelo tenant). */
  async revalidateCurrentTenant(): Promise<void> {
    const companyId = this.tenant.getCompanyId();
    if (!companyId) return;
    const company = await this.companies.findOne({
      where: { id: companyId },
      select: { storeSlug: true },
    });
    await this.revalidateSlug(company?.storeSlug ?? null);
  }

  /** Purga a vitrine de um slug específico. No-op se não houver config. */
  async revalidateSlug(slug: string | null | undefined): Promise<void> {
    if (!slug) return;
    const url = process.env.STORE_REVALIDATE_URL;
    const secret = process.env.STORE_REVALIDATE_SECRET;
    if (!url || !secret) return;
    const tags = [`floravie-catalog:${slug}`, `floravie-branding:${slug}`];
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, tags }),
      });
      if (!res.ok) {
        this.logger.warn(`Revalidação da vitrine falhou (HTTP ${res.status}).`);
      }
    } catch (err) {
      this.logger.warn(`Revalidação da vitrine indisponível: ${String(err)}`);
    }
  }
}
