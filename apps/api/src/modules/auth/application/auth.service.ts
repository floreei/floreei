import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  type ProvisionInput,
  type PublicUser,
  resolveCompanyAccess,
  resolveEntitlements,
  TRIAL_LENGTH_DAYS,
} from "@sistema-flores/types";
import { DataSource, Repository } from "typeorm";
import type { FirebaseIdentity } from "../../../common/auth/firebase-token.guard";
import { CompanyEntity } from "../../companies/infrastructure/company.entity";
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
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
  ) {}

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
          company.tier,
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

    const now = new Date();
    const user = await this.dataSource.transaction(async (manager) => {
      const company = await manager.save(
        manager.create(CompanyEntity, {
          name: input.companyName,
          // Trial começa no cadastro (= primeiro acesso).
          plan: "TRIAL",
          firstAccessAt: now,
          trialEndsAt: new Date(now.getTime() + TRIAL_LENGTH_DAYS * 86_400_000),
          lastSeenAt: now,
        }),
      );
      return manager.save(
        manager.create(UserEntity, {
          companyId: company.id,
          name: input.name,
          email: firebase.email,
          firebaseUid: firebase.uid,
          role: "ADMIN",
          active: true,
        }),
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
