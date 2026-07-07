import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import {
  ACCESS_DENIED_CODES,
  type Feature,
  resolveCompanyAccess,
  resolveEntitlements,
  TRIAL_LENGTH_DAYS,
} from "@sistema-flores/types";
import { Repository } from "typeorm";
import { CompanyEntity } from "../../modules/companies/infrastructure/company.entity";
import { PlanDefinitionsService } from "../../modules/plans/plan-definitions.service";
import { UserEntity } from "../../modules/users/infrastructure/user.entity";
import { FirebaseService } from "../firebase/firebase.service";
import { ALLOW_BLOCKED_COMPANY_KEY } from "./allow-blocked-company.decorator";
import type { AuthUser } from "./auth-user";
import { IS_PUBLIC_KEY } from "./public.decorator";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Só regravamos `last_seen_at` se passou mais de 1h — evita escrita a cada request. */
const SEEN_THROTTLE_MS = 60 * 60 * 1000;

/** Requisição HTTP com os campos que os guards de auth leem/escrevem. */
export interface AuthRequest {
  headers: { authorization?: string };
  user?: AuthUser;
}

/** Extrai o token "Bearer <jwt>" do header Authorization. */
export function extractBearer(req: { headers: { authorization?: string } }):
  | string
  | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

/**
 * Verifica o ID token do Firebase, resolve o usuário local por `firebaseUid` e
 * expõe o `AuthUser` em `req.user` — o mesmo contrato que o tenant/RBAC usam.
 * Rotas marcadas com @Public() são liberadas.
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly firebase: FirebaseService,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
    private readonly planDefs: PlanDefinitionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthRequest>();
    const token = extractBearer(req);
    if (!token) throw new UnauthorizedException("Sessão inválida.");

    let decoded: { uid: string; email_verified?: boolean };
    try {
      decoded = await this.firebase.auth().verifyIdToken(token);
    } catch {
      throw new UnauthorizedException("Sessão expirada. Faça login novamente.");
    }

    // Exige e-mail verificado (login com Google já vem verificado). Impede usar
    // uma conta cujo e-mail não foi comprovado. Relaxado nos testes e2e.
    if (!decoded.email_verified && process.env.NODE_ENV !== "test") {
      throw new ForbiddenException({
        statusCode: 403,
        code: ACCESS_DENIED_CODES.EMAIL_NOT_VERIFIED,
        message: "Verifique seu e-mail para continuar.",
      });
    }
    const uid = decoded.uid;

    const user = await this.users.findOne({ where: { firebaseUid: uid } });
    if (!user || !user.active) {
      throw new UnauthorizedException("Conta não encontrada.");
    }

    // Rotas de billing continuam acessíveis com a empresa bloqueada (reassinar).
    const allowBlocked = this.reflector.getAllAndOverride<boolean>(
      ALLOW_BLOCKED_COMPANY_KEY,
      [context.getHandler(), context.getClass()],
    );
    const features = await this.enforceCompanyAccess(
      user.companyId,
      allowBlocked === true,
    );

    req.user = {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
      features,
    };
    return true;
  }

  /**
   * Controle de acesso do tenant: inicia o trial no primeiro acesso, registra o
   * último acesso (com throttle) e bloqueia empresa suspensa ou com trial expirado.
   */
  private async enforceCompanyAccess(
    companyId: string,
    allowBlocked = false,
  ): Promise<Feature[]> {
    const company = await this.companies.findOne({ where: { id: companyId } });
    if (!company) throw new UnauthorizedException("Empresa não encontrada.");

    const now = new Date();
    const patch: Partial<CompanyEntity> = {};

    if (!company.firstAccessAt) {
      company.firstAccessAt = patch.firstAccessAt = now;
      if (!company.trialEndsAt) {
        company.trialEndsAt = patch.trialEndsAt = new Date(
          now.getTime() + TRIAL_LENGTH_DAYS * DAY_MS,
        );
      }
    }
    if (
      !company.lastSeenAt ||
      now.getTime() - new Date(company.lastSeenAt).getTime() > SEEN_THROTTLE_MS
    ) {
      company.lastSeenAt = patch.lastSeenAt = now;
    }
    if (Object.keys(patch).length > 0) {
      await this.companies.update({ id: company.id }, patch);
    }

    const resolved = resolveCompanyAccess(
      {
        plan: company.plan,
        suspended: company.suspended,
        trialEndsAt: company.trialEndsAt,
        subscriptionStatus: company.subscriptionStatus,
        paymentFailedAt: company.paymentFailedAt,
      },
      now,
    );
    // Suspensão manual do gestor barra sempre; os demais bloqueios podem ser
    // dispensados (rotas de billing, para a empresa conseguir reassinar).
    if (!resolved.allowed && allowBlocked && resolved.status !== "SUSPENDED") {
      return resolveEntitlements(
        await this.planDefs.featuresOf(company.tier),
        company.featureOverrides,
        resolved.status,
      );
    }
    if (!resolved.allowed) {
      const denial = {
        SUSPENDED: {
          code: ACCESS_DENIED_CODES.SUSPENDED,
          message: "Acesso suspenso. Fale com o suporte para reativar.",
        },
        PAYMENT_OVERDUE: {
          code: ACCESS_DENIED_CODES.PAYMENT_OVERDUE,
          message: "Pagamento da assinatura pendente. Regularize para continuar.",
        },
      }[resolved.status as string] ?? {
        code: ACCESS_DENIED_CODES.EXPIRED,
        message: "Seu período gratuito terminou. Assine para continuar.",
      };
      throw new ForbiddenException({
        statusCode: 403,
        status: resolved.status,
        ...denial,
        trialEndsAt: company.trialEndsAt,
      });
    }

    return resolveEntitlements(
      await this.planDefs.featuresOf(company.tier),
      company.featureOverrides,
      resolved.status,
    );
  }
}
