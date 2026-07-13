import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  Feature,
  PlanOffer,
  PlanTier,
  UpdatePlanDefinitionInput,
} from "@sistema-flores/types";
import { PLAN_TIER_LIST } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { PlanDefinitionEntity } from "./plan-definition.entity";

/** Idade máxima do cache — mudanças no console valem em até este intervalo. */
const CACHE_TTL_MS = 30_000;

/**
 * Definições vigentes dos planos, lidas do banco com cache em memória — o
 * guard de auth resolve features a cada request e não pode pagar uma query
 * extra sempre. `update()` invalida o cache da instância na hora.
 */
@Injectable()
export class PlanDefinitionsService {
  private cache: Map<PlanTier, PlanDefinitionEntity> | null = null;
  private cachedAt = 0;

  constructor(
    @InjectRepository(PlanDefinitionEntity)
    private readonly plans: Repository<PlanDefinitionEntity>,
  ) {}

  /** Todos os planos, na ordem de contratação (barato → completo). */
  async list(): Promise<PlanDefinitionEntity[]> {
    const map = await this.loaded();
    return PLAN_TIER_LIST.map((t) => map.get(t.id)).filter(
      (d): d is PlanDefinitionEntity => d !== undefined,
    );
  }

  async get(tier: PlanTier): Promise<PlanDefinitionEntity> {
    const def = (await this.loaded()).get(tier);
    if (!def) throw new NotFoundException("Plano não encontrado.");
    return def;
  }

  /** Features do plano; null/desconhecido → nenhuma. */
  async featuresOf(tier: PlanTier | null): Promise<Feature[]> {
    if (!tier) return [];
    const def = (await this.loaded()).get(tier);
    return def?.features ?? [];
  }

  /** Edita a definição vigente (console do gestor). */
  async update(
    tier: PlanTier,
    input: UpdatePlanDefinitionInput,
  ): Promise<PlanDefinitionEntity> {
    const def = await this.plans.findOne({ where: { tier } });
    if (!def) throw new NotFoundException("Plano não encontrado.");
    if (input.name !== undefined) def.name = input.name;
    if (input.tagline !== undefined) def.tagline = input.tagline;
    if (input.basePrice !== undefined) def.basePrice = input.basePrice;
    if (input.userPrice !== undefined) def.userPrice = input.userPrice;
    if (input.features !== undefined) def.features = input.features;
    if (input.assistantTokenQuota !== undefined) {
      def.assistantTokenQuota = input.assistantTokenQuota;
    }
    const saved = await this.plans.save(def);
    this.invalidate();
    return saved;
  }

  toOffer(def: PlanDefinitionEntity): PlanOffer {
    return {
      id: def.tier,
      name: def.name,
      tagline: def.tagline,
      basePrice: def.basePrice,
      userPrice: def.userPrice,
      features: def.features,
      assistantTokenQuota: def.assistantTokenQuota,
    };
  }

  private invalidate(): void {
    this.cache = null;
    this.cachedAt = 0;
  }

  private async loaded(): Promise<Map<PlanTier, PlanDefinitionEntity>> {
    if (this.cache && Date.now() - this.cachedAt < CACHE_TTL_MS) {
      return this.cache;
    }
    const rows = await this.plans.find();
    this.cache = new Map(rows.map((r) => [r.tier, r]));
    this.cachedAt = Date.now();
    return this.cache;
  }
}
