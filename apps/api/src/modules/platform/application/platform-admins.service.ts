import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  InvitePlatformAdminInput,
  PlatformAdminView,
} from "@sistema-flores/types";
import { Repository } from "typeorm";
import { PlatformAdminEntity } from "../infrastructure/platform-admin.entity";

function toView(row: PlatformAdminEntity): PlatformAdminView {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class PlatformAdminsService {
  constructor(
    @InjectRepository(PlatformAdminEntity)
    private readonly admins: Repository<PlatformAdminEntity>,
  ) {}

  async list(): Promise<PlatformAdminView[]> {
    const rows = await this.admins.find({ order: { createdAt: "ASC" } });
    return rows.map(toView);
  }

  /**
   * Convida um gestor: cria a linha sem `firebaseUid`. O vínculo com o Firebase
   * acontece no primeiro login (o guard casa por e-mail e grava o uid).
   */
  async invite(input: InvitePlatformAdminInput): Promise<PlatformAdminView> {
    const existing = await this.admins.findOne({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException("Já existe um gestor com este e-mail.");
    }
    const row = await this.admins.save(
      this.admins.create({
        email: input.email,
        name: input.name,
        role: input.role,
        active: true,
      }),
    );
    return toView(row);
  }

  async remove(id: string, requesterId: string): Promise<void> {
    if (id === requesterId) {
      throw new ForbiddenException("Você não pode remover a si mesmo.");
    }
    const row = await this.admins.findOne({ where: { id } });
    if (!row) throw new NotFoundException("Gestor não encontrado.");
    await this.admins.delete({ id });
  }
}
