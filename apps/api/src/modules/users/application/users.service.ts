import { randomBytes } from "node:crypto";
import { ConflictException, Injectable, Logger } from "@nestjs/common";
import type {
  CreateUserInput,
  InviteResult,
  PublicUser,
  UpdateUserInput,
} from "@sistema-flores/types";
import { EmailService } from "../../../common/email/email.service";
import { FirebaseService } from "../../../common/firebase/firebase.service";
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
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly users: UserRepository,
    private readonly tenant: TenantContextService,
    private readonly billing: BillingService,
    private readonly email: EmailService,
    private readonly firebase: FirebaseService,
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

  /**
   * Remove um membro da equipe (ou cancela um convite pendente). Apaga o login
   * no Firebase quando existe e recalcula a cobrança por usuário. Protegido
   * contra se auto-remover e contra deixar a empresa sem administrador.
   */
  async remove(id: string, currentUserId: string): Promise<void> {
    const user = await this.users.findByIdOrFail(id);
    if (user.id === currentUserId) {
      throw new ConflictException(
        "Você não pode remover a si mesmo da equipe.",
      );
    }
    if (user.role === "ADMIN") {
      const admins = await this.users.count({ role: "ADMIN", active: true });
      if (admins <= 1) {
        throw new ConflictException(
          "A empresa precisa de ao menos um administrador.",
        );
      }
    }

    const firebaseUid = user.firebaseUid;
    await this.users.deleteById(user.id);
    await this.billing.syncUserCount(this.tenant.getCompanyIdOrThrow());

    // Melhor esforço: sem Admin SDK a exclusão do login vira no-op (logado).
    if (firebaseUid) {
      await this.firebase.deleteAuthUser(firebaseUid).catch((error) => {
        this.logger.error(
          `Falha ao apagar o login ${firebaseUid} no Firebase`,
          error instanceof Error ? error.stack : String(error),
        );
      });
    }
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
