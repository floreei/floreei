import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  TRIAL_ASSISTANT_TOKEN_QUOTA,
  type AiUsage,
  type AssistantUsageSummary,
  type PlanTier,
} from "@sistema-flores/types";
import { Repository } from "typeorm";
import { CompanyEntity } from "../../companies/infrastructure/company.entity";
import { PlanDefinitionsService } from "../../plans/plan-definitions.service";
import { AssistantUsageEntity } from "../infrastructure/assistant-usage.entity";

interface MonthUsage {
  input: number;
  output: number;
  cacheRead: number;
  cacheCreation: number;
  total: number;
}

// Câmbio e preço de referência (Haiku, USD por 1M tokens) só para estimar custo.
const USD_BRL = 5.5;
const PRICE = { input: 1, output: 5, cacheRead: 0.1, cacheCreation: 1.25 };

/**
 * Medição de uso do assistente por empresa (tokens/mês) e resolução da cota
 * efetiva (override da empresa → plano → trial). Escopo cross-tenant (o gestor
 * consulta), então filtra por companyId explicitamente.
 */
@Injectable()
export class AssistantUsageService {
  constructor(
    @InjectRepository(AssistantUsageEntity)
    private readonly usage: Repository<AssistantUsageEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
    private readonly planDefs: PlanDefinitionsService,
  ) {}

  async record(companyId: string, u: AiUsage): Promise<void> {
    await this.usage.save(
      this.usage.create({
        companyId,
        inputTokens: u.inputTokens,
        outputTokens: u.outputTokens,
        cacheReadTokens: u.cacheReadTokens,
        cacheCreationTokens: u.cacheCreationTokens,
      }),
    );
  }

  /** Ainda há cota no mês corrente? */
  async withinQuota(companyId: string): Promise<boolean> {
    const [usage, quota] = await Promise.all([
      this.monthUsage(companyId),
      this.effectiveQuota(companyId),
    ]);
    return usage.total < quota;
  }

  async summary(companyId: string): Promise<AssistantUsageSummary> {
    const company = await this.companies.findOne({ where: { id: companyId } });
    const usage = await this.monthUsage(companyId);
    const planQuota = await this.planQuota(company?.tier ?? null);
    const override = company?.assistantTokenQuota ?? null;
    const quota = override ?? planQuota;
    return {
      monthTokens: usage.total,
      quota,
      quotaOverride: override,
      planQuota,
      remaining: Math.max(0, quota - usage.total),
      estimatedCostBRL: estimateCostBRL(usage),
    };
  }

  private async effectiveQuota(companyId: string): Promise<number> {
    const company = await this.companies.findOne({ where: { id: companyId } });
    if (company?.assistantTokenQuota != null) return company.assistantTokenQuota;
    return this.planQuota(company?.tier ?? null);
  }

  private async planQuota(tier: PlanTier | null): Promise<number> {
    if (!tier) return TRIAL_ASSISTANT_TOKEN_QUOTA;
    try {
      return (await this.planDefs.get(tier)).assistantTokenQuota;
    } catch {
      return TRIAL_ASSISTANT_TOKEN_QUOTA;
    }
  }

  private async monthUsage(companyId: string): Promise<MonthUsage> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const row = await this.usage
      .createQueryBuilder("u")
      .select("COALESCE(SUM(u.input_tokens),0)", "input")
      .addSelect("COALESCE(SUM(u.output_tokens),0)", "output")
      .addSelect("COALESCE(SUM(u.cache_read_tokens),0)", "cacheRead")
      .addSelect("COALESCE(SUM(u.cache_creation_tokens),0)", "cacheCreation")
      .where("u.company_id = :cid", { cid: companyId })
      .andWhere("u.created_at >= :start", { start })
      .getRawOne<{
        input: string;
        output: string;
        cacheRead: string;
        cacheCreation: string;
      }>();
    const input = Number(row?.input ?? 0);
    const output = Number(row?.output ?? 0);
    const cacheRead = Number(row?.cacheRead ?? 0);
    const cacheCreation = Number(row?.cacheCreation ?? 0);
    return {
      input,
      output,
      cacheRead,
      cacheCreation,
      total: input + output + cacheRead + cacheCreation,
    };
  }
}

function estimateCostBRL(u: MonthUsage): number {
  const usd =
    (u.input * PRICE.input +
      u.output * PRICE.output +
      u.cacheRead * PRICE.cacheRead +
      u.cacheCreation * PRICE.cacheCreation) /
    1_000_000;
  return Math.round(usd * USD_BRL * 100) / 100;
}
