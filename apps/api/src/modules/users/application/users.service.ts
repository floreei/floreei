import { randomBytes } from "node:crypto";
import { ConflictException, Injectable } from "@nestjs/common";
import type {
  CreateUserInput,
  InviteResult,
  PublicUser,
  UpdateUserInput,
} from "@sistema-flores/types";
import { EmailService } from "../../../common/email/email.service";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { BillingService } from "../../billing/application/billing.service";
import { UserRepository } from "../infrastructure/user.repository";
import { toPublicUser } from "./user.mapper";

/** URL base do app (web) para montar o link de convite. */
function appUrl(): string {
  return process.env.APP_URL ?? "https://app.floreei.com.br";
}

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UserRepository,
    private readonly tenant: TenantContextService,
    private readonly billing: BillingService,
    private readonly email: EmailService,
  ) {}

  /** Lista os membros da equipe (inclui convites pendentes, sem login ainda). */
  async list(): Promise<PublicUser[]> {
    const found = await this.users.findAll({ order: { name: "ASC" } });
    return found.map(toPublicUser);
  }

  /**
   * Convida um membro por e-mail (sem senha). Cria o registro com um token de
   * convite, dispara o e-mail com o link e retorna o link para compartilhar
   * manualmente — funciona mesmo sem provedor de e-mail configurado.
   */
  async create(input: CreateUserInput): Promise<InviteResult> {
    if (await this.users.emailExistsGlobally(input.email)) {
      throw new ConflictException("Já existe uma conta com este e-mail.");
    }

    const token = randomBytes(24).toString("hex");
    const user = this.users.create({
      name: input.name,
      email: input.email,
      role: input.role,
      inviteToken: token,
      active: true,
    });
    const saved = await this.users.save(user);
    // Usuários são cobrados por cabeça: recalcula o valor da assinatura.
    await this.billing.syncUserCount(this.tenant.getCompanyIdOrThrow());

    const inviteUrl = `${appUrl()}/convite?token=${token}`;
    // Melhor esforço: o link volta na resposta de qualquer forma.
    await this.sendInviteEmail(saved.email, saved.name, inviteUrl).catch(
      () => undefined,
    );

    return { user: toPublicUser(saved), inviteUrl };
  }

  /** Atualiza nome, papel ou status de um membro. */
  async update(id: string, input: UpdateUserInput): Promise<PublicUser> {
    const user = await this.users.findByIdOrFail(id);
    const wasActive = user.active;
    Object.assign(user, input);
    const saved = await this.users.save(user);
    if (saved.active !== wasActive) {
      await this.billing.syncUserCount(this.tenant.getCompanyIdOrThrow());
    }
    return toPublicUser(saved);
  }

  private async sendInviteEmail(
    to: string,
    name: string,
    url: string,
  ): Promise<void> {
    await this.email.send({
      to,
      subject: "Você foi convidado para o Floreei",
      html: `<p>Olá, ${name}!</p>
<p>Você foi convidado para uma equipe no <strong>Floreei</strong>. Clique no link abaixo para definir sua senha e acessar:</p>
<p><a href="${url}">Aceitar convite e definir senha</a></p>
<p>Se o botão não funcionar, copie e cole este endereço no navegador:<br>${url}</p>`,
    });
  }
}
