import { Injectable } from "@nestjs/common";
import {
  DEFAULT_DUNNING_STEPS,
  type DunningSettings,
  type DunningSettingsInput,
} from "@sistema-flores/types";
import { DunningSettingsEntity } from "../infrastructure/dunning-settings.entity";
import { DunningSettingsRepository } from "../infrastructure/dunning-settings.repository";

/** Entidade → DTO (com defaults quando a empresa ainda não configurou). */
export function toDunningSettings(
  e: DunningSettingsEntity | null,
): DunningSettings {
  return {
    enabled: e?.enabled ?? false,
    steps: e?.steps?.length ? e.steps : DEFAULT_DUNNING_STEPS,
    paymentMethod: e?.paymentMethod ?? "NONE",
    pixKey: e?.pixKey ?? null,
    mpLink: e?.mpLink ?? null,
    extraLine: e?.extraLine ?? null,
  };
}

@Injectable()
export class DunningSettingsService {
  constructor(private readonly repo: DunningSettingsRepository) {}

  async get(): Promise<DunningSettings> {
    return toDunningSettings(await this.repo.findForCompany());
  }

  async update(input: DunningSettingsInput): Promise<DunningSettings> {
    const existing = await this.repo.findForCompany();
    const entity = existing ?? this.repo.create({});
    entity.enabled = input.enabled;
    entity.steps = input.steps;
    entity.paymentMethod = input.paymentMethod;
    entity.pixKey = input.pixKey ?? null;
    entity.mpLink = input.mpLink ?? null;
    entity.extraLine = input.extraLine ?? null;
    return toDunningSettings(await this.repo.save(entity));
  }
}
