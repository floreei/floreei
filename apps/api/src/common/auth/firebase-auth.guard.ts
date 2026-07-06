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
  resolveCompanyAccess,
  TRIAL_LENGTH_DAYS,
} from "@sistema-flores/types";
import { Repository } from "typeorm";
import { CompanyEntity } from "../../modules/companies/infrastructure/company.entity";
import { UserEntity } from "../../modules/users/infrastructure/user.entity";
import { FirebaseService } from "../firebase/firebase.service";
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

    await this.enforceCompanyAccess(user.companyId);

    req.user = {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
    };
    return true;
  }

  /**
   * Controle de acesso do tenant: inicia o trial no primeiro acesso, registra o
   * último acesso (com throttle) e bloqueia empresa suspensa ou com trial expirado.
   */
  private async enforceCompanyAccess(companyId: string): Promise<void> {
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
      },
      now,
    );
    if (!resolved.allowed) {
      const suspended = resolved.status === "SUSPENDED";
      throw new ForbiddenException({
        statusCode: 403,
        status: resolved.status,
        code: suspended
          ? ACCESS_DENIED_CODES.SUSPENDED
          : ACCESS_DENIED_CODES.EXPIRED,
        message: suspended
          ? "Acesso suspenso. Fale com o suporte para reativar."
          : "Seu período gratuito terminou. Fale com a gente para continuar.",
        trialEndsAt: company.trialEndsAt,
      });
    }
  }
}
