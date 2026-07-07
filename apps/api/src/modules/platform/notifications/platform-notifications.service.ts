import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  PlatformNotification,
  PlatformNotificationsResult,
  PlatformNotificationType,
} from "@sistema-flores/types";
import { Repository } from "typeorm";
import { PlatformNotificationEntity } from "../infrastructure/platform-notification.entity";

/** Feed de notificações do console. Isolado para AuthModule criar sem ciclo. */
@Injectable()
export class PlatformNotificationsService {
  constructor(
    @InjectRepository(PlatformNotificationEntity)
    private readonly notifications: Repository<PlatformNotificationEntity>,
  ) {}

  async create(input: {
    type: PlatformNotificationType;
    title: string;
    body: string;
    companyId?: string | null;
  }): Promise<void> {
    await this.notifications.save(
      this.notifications.create({
        type: input.type,
        title: input.title,
        body: input.body,
        companyId: input.companyId ?? null,
        read: false,
      }),
    );
  }

  /** Lista (mais recentes primeiro) + contagem de não-lidas para o badge. */
  async list(): Promise<PlatformNotificationsResult> {
    const [rows, unread] = await Promise.all([
      this.notifications.find({ order: { createdAt: "DESC" }, take: 100 }),
      this.notifications.count({ where: { read: false } }),
    ]);
    return { items: rows.map((r) => this.toView(r)), unread };
  }

  async markAllRead(): Promise<void> {
    await this.notifications.update({ read: false }, { read: true });
  }

  private toView(row: PlatformNotificationEntity): PlatformNotification {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      companyId: row.companyId,
      read: row.read,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
