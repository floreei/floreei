import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  documentDigits,
  type ProvisionInput,
  type PublicUser,
  resolveCompanyAccess,
  resolveEntitlements,
  TRIAL_LENGTH_DAYS,
} from "@sistema-flores/types";
import { DataSource, Repository } from "typeorm";
import type { FirebaseIdentity } from "../../../common/auth/firebase-token.guard";
import { EmailService } from "../../../common/email/email.service";
import { CompanyEntity } from "../../companies/infrastructure/company.entity";
import { PlanDefinitionsService } from "../../plans/plan-definitions.service";
import { PlatformNotificationsService } from "../../platform/notifications/platform-notifications.service";
import { UserEntity } from "../../users/infrastructure/user.entity";

function toPublicUser(user: UserEntity): PublicUser {
  return {
    id: user.id,
    companyId: user.companyId,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
    private readonly planDefs: PlanDefinitionsService,
    private readonly email: EmailService,
    private readonly notifications: PlatformNotificationsService,
  ) {}

  /**
   * Avisa o gestor de um novo cadastro: registra a notificação no console e
   * dispara um e-mail para o operador da plataforma. Melhor esforço — o
   * chamador engole erros para não afetar o cadastro.
   */
  private async announceNewCompany(
    company: CompanyEntity,
    user: UserEntity,
  ): Promise<void> {
    const title = `Nova empresa: ${company.name}`;
    const body = `${user.name} (${user.email}) cadastrou "${company.name}" — documento ${company.document ?? "—"}.`;

    await this.notifications.create({
      type: "NEW_COMPANY",
      title,
      body,
      companyId: company.id,
    });

    const to = process.env.PLATFORM_NOTIFY_EMAIL ?? "hugouraga61@gmail.com";
    await this.email.send({
      to,
      subject: `Floreei — nova empresa cadastrada: ${company.name}`,
      html: `
        <h2>Nova empresa no Floreei</h2>
        <p><strong>${company.name}</strong> começou o período gratuito.</p>
        <ul>
          <li>Documento (CNPJ/CPF): ${company.document ?? "—"}</li>
          <li>Responsável: ${user.name}</li>
          <li>E-mail: ${user.email}</li>
          <li>Data: ${new Date().toLocaleString("pt-BR")}</li>
        </ul>
      `,
    });
  }

  private async withCompanyInfo(user: PublicUser): Promise<PublicUser> {
    const company = await this.companies.findOne({
      where: { id: user.companyId },
    });
    if (!company) return user;
    const resolved = resolveCompanyAccess(
      {
        plan: company.plan,
        suspended: company.suspended,
        trialEndsAt: company.trialEndsAt,
        subscriptionStatus: company.subscriptionStatus,
        paymentFailedAt: company.paymentFailedAt,
      },
      new Date(),
    );
    return {
      ...user,
      companyName: company.name,
      access: {
        plan: company.plan,
        status: resolved.status,
        trialDaysLeft: resolved.trialDaysLeft,
        trialEndsAt: company.trialEndsAt
          ? company.trialEndsAt.toISOString()
          : null,
        tier: company.tier,
        subscriptionStatus: company.subscriptionStatus,
        graceDaysLeft: resolved.graceDaysLeft,
        features: resolveEntitlements(
          await this.planDefs.featuresOf(company.tier),
          company.featureOverrides,
          resolved.status,
        ),
      },
    };
  }

  /**
   * Provisionamento self-service: com a identidade já autenticada no Firebase,
   * cria a empresa e o usuário administrador vinculado ao `firebaseUid`.
   */
  async provision(
    firebase: FirebaseIdentity,
    input: ProvisionInput,
  ): Promise<PublicUser> {
    const already = await this.users.findOne({
      where: { firebaseUid: firebase.uid },
    });
    if (already) {
      throw new ConflictException("Esta conta já foi provisionada.");
    }
    if (await this.users.findOne({ where: { email: firebase.email } })) {
      throw new ConflictException("Já existe uma conta com este e-mail.");
    }
    // Um cadastro por CNPJ/CPF: trava trial repetido do mesmo negócio (e-mail é
    // grátis de criar; o documento não). Compara só os dígitos.
    const digits = documentDigits(input.document);
    const [dup] = (await this.dataSource.query(
      `SELECT 1 FROM companies WHERE regexp_replace(coalesce(document,''), '\\D', '', 'g') = $1 LIMIT 1`,
      [digits],
    )) as unknown[];
    if (dup) {
      throw new ConflictException(
        "Já existe um cadastro com este CNPJ/CPF. Entre na sua conta ou fale com a gente.",
      );
    }

    const now = new Date();
    const { company, user } = await this.dataSource.transaction(
      async (manager) => {
        const company = await manager.save(
          manager.create(CompanyEntity, {
            name: input.companyName,
            document: input.document,
            // Trial começa no cadastro (= primeiro acesso).
            plan: "TRIAL",
            firstAccessAt: now,
            trialEndsAt: new Date(
              now.getTime() + TRIAL_LENGTH_DAYS * 86_400_000,
            ),
            lastSeenAt: now,
          }),
        );
        const user = await manager.save(
          manager.create(UserEntity, {
            companyId: company.id,
            name: input.name,
            email: firebase.email,
            firebaseUid: firebase.uid,
            role: "ADMIN",
            active: true,
          }),
        );
        return { company, user };
      },
    );

    // Avisa o gestor (console + e-mail). Nunca quebra o cadastro por isso.
    await this.announceNewCompany(company, user).catch((error) => {
      this.logger.error(
        `Falha ao avisar sobre o novo cadastro ${company.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    });

    return this.withCompanyInfo(toPublicUser(user));
  }

  /** Retorna o perfil do usuário autenticado. */
  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.withCompanyInfo(toPublicUser(user));
  }
}
