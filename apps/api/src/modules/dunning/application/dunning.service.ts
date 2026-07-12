import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { CobrancaMessage, DunningLogEntry } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { todayISO } from "../../../common/date/today";
import { roundMoney } from "../../../common/money/money";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { CompanyEntity } from "../../companies/infrastructure/company.entity";
import { EventEntity } from "../../events/infrastructure/event.entity";
import { DunningLogEntity } from "../infrastructure/dunning-log.entity";
import { DunningSettingsEntity } from "../infrastructure/dunning-settings.entity";
import { buildDunningMessage } from "./dunning-message";
import { DunningSender } from "./dunning-sender.service";
import {
  DunningSettingsService,
  toDunningSettings,
} from "./dunning-settings.service";

/** Soma dias a uma data "AAAA-MM-DD" e devolve no mesmo formato (UTC-safe). */
function addDays(iso: string, days: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Normaliza o telefone para dígitos com DDI 55 (Brasil) quando faltar. */
function toPhone(raw: string | null): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.length <= 11 ? `55${digits}` : digits;
}

/** Dias de `a` até `b` (positivo se `b` é depois de `a`). */
function daysBetween(a: string, b: string): number {
  const ms =
    Date.parse(`${b.slice(0, 10)}T00:00:00Z`) -
    Date.parse(`${a.slice(0, 10)}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

interface Reminder {
  eventId: string;
  customerName: string;
  to: string;
  balanceDue: number;
  dueDate: string;
  offsetDays: number;
}

@Injectable()
export class DunningService {
  private readonly logger = new Logger(DunningService.name);

  constructor(
    @InjectRepository(DunningSettingsEntity)
    private readonly settings: Repository<DunningSettingsEntity>,
    @InjectRepository(DunningLogEntity)
    private readonly logs: Repository<DunningLogEntity>,
    @InjectRepository(EventEntity)
    private readonly events: Repository<EventEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
    private readonly sender: DunningSender,
    private readonly settingsService: DunningSettingsService,
    private readonly tenant: TenantContextService,
  ) {}

  /** Monta a cobrança de uma venda para envio MANUAL (abrir no WhatsApp). */
  async buildManualCobranca(eventId: string): Promise<CobrancaMessage> {
    const companyId = this.tenant.getCompanyIdOrThrow();
    const event = await this.events.findOne({
      where: { id: eventId, companyId },
      relations: ["customer"],
    });
    if (!event) throw new NotFoundException("Venda não encontrada.");
    const balance = roundMoney(event.soldValue - event.receivedValue);
    if (balance <= 0) {
      throw new BadRequestException("Esta venda já está quitada.");
    }
    const dueDate = (event.dueDate ?? event.date).slice(0, 10);
    const company = await this.companies.findOne({ where: { id: companyId } });
    const message = buildDunningMessage(
      {
        companyName: company?.name ?? "sua floricultura",
        customerName: event.customer?.name ?? "cliente",
        amount: balance,
        dueDate,
        offsetDays: daysBetween(dueDate, todayISO()),
      },
      await this.settingsService.get(),
    );
    return {
      phone: toPhone(event.customer?.whatsapp ?? event.customer?.phone ?? null),
      message,
    };
  }

  /** Roda a régua de todas as empresas com cobrança ligada. */
  async runAll(today = todayISO()): Promise<{ processed: number; sent: number }> {
    const enabled = await this.settings.find({ where: { enabled: true } });
    let processed = 0;
    let sent = 0;
    for (const s of enabled) {
      const r = await this.runForCompany(s, today);
      processed += r.processed;
      sent += r.sent;
    }
    this.logger.log(`Régua: ${sent}/${processed} enviados (${enabled.length} empresas).`);
    return { processed, sent };
  }

  async runForCompany(
    settings: DunningSettingsEntity,
    today = todayISO(),
  ): Promise<{ processed: number; sent: number }> {
    const company = await this.companies.findOne({
      where: { id: settings.companyId },
    });
    const companyName = company?.name ?? "sua floricultura";
    const dto = toDunningSettings(settings);
    const reminders = await this.dueReminders(settings, today);
    let sent = 0;

    for (const rem of reminders) {
      const text = buildDunningMessage(
        {
          companyName,
          customerName: rem.customerName,
          amount: rem.balanceDue,
          dueDate: rem.dueDate,
          offsetDays: rem.offsetDays,
        },
        dto,
      );
      const res = await this.sender.send(rem.to, text);
      await this.logs.save(
        this.logs.create({
          companyId: settings.companyId,
          eventId: rem.eventId,
          customerName: rem.customerName,
          step: rem.offsetDays,
          status: res.ok ? "SENT" : "FAILED",
          channel: res.channel,
          message: text,
          sentAt: new Date(),
          error: res.error ?? null,
        }),
      );
      if (res.ok) sent++;
    }
    return { processed: reminders.length, sent };
  }

  /** Contas a receber com contato cujo vencimento+offset cai hoje e sem log. */
  private async dueReminders(
    settings: DunningSettingsEntity,
    today: string,
  ): Promise<Reminder[]> {
    const steps = (settings.steps ?? []).filter((s) => s.enabled);
    if (steps.length === 0) return [];

    const rows = await this.events
      .createQueryBuilder("event")
      .innerJoin("event.customer", "customer")
      .select("event.id", "event_id")
      .addSelect(
        "TO_CHAR(COALESCE(event.due_date, event.date), 'YYYY-MM-DD')",
        "date",
      )
      .addSelect("event.soldValue", "sold")
      .addSelect("event.receivedValue", "received")
      .addSelect("customer.name", "customer_name")
      .addSelect("customer.whatsapp", "whatsapp")
      .addSelect("customer.phone", "phone")
      .where("event.company_id = :cid", { cid: settings.companyId })
      .andWhere("event.status <> 'CANCELED'")
      .andWhere("event.sold_value > event.received_value")
      .getRawMany<{
        event_id: string;
        date: string;
        sold: string;
        received: string;
        customer_name: string;
        whatsapp: string | null;
        phone: string | null;
      }>();

    const done = new Set(
      (await this.logs.find({ where: { companyId: settings.companyId } })).map(
        (l) => `${l.eventId}:${l.step}`,
      ),
    );

    const out: Reminder[] = [];
    for (const row of rows) {
      const to = toPhone(row.whatsapp || row.phone);
      if (!to) continue;
      const dueDate = String(row.date).slice(0, 10);
      for (const step of steps) {
        if (addDays(dueDate, step.offsetDays) !== today) continue;
        if (done.has(`${row.event_id}:${step.offsetDays}`)) continue;
        out.push({
          eventId: row.event_id,
          customerName: row.customer_name,
          to,
          balanceDue: roundMoney(Number(row.sold) - Number(row.received)),
          dueDate,
          offsetDays: step.offsetDays,
        });
      }
    }
    return out;
  }

  async history(companyId: string): Promise<DunningLogEntry[]> {
    const rows = await this.logs.find({
      where: { companyId },
      order: { sentAt: "DESC" },
      take: 100,
    });
    return rows.map((l) => ({
      id: l.id,
      eventId: l.eventId,
      customerName: l.customerName,
      step: l.step,
      status: l.status,
      channel: l.channel,
      message: l.message,
      sentAt: l.sentAt instanceof Date ? l.sentAt.toISOString() : l.sentAt,
      error: l.error,
    }));
  }
}
