import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import type { PlatformAdminRole } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { extractBearer } from "../../../common/auth/firebase-auth.guard";
import { FirebaseService } from "../../../common/firebase/firebase.service";
import { PlatformAdminEntity } from "../infrastructure/platform-admin.entity";

/** Gestor autenticado anexado à requisição do console. */
export interface PlatformAdminContext {
  id: string;
  email: string;
  name: string;
  role: PlatformAdminRole;
}

export interface PlatformRequest {
  headers: { authorization?: string };
  platformAdmin?: PlatformAdminContext;
}

/**
 * Autentica o gestor da plataforma nas rotas `/admin/*`: valida o ID token do
 * Firebase e resolve a identidade em `platform_admins`. E-mails listados em
 * `PLATFORM_OWNER_EMAILS` são provisionados como OWNER no primeiro login (bootstrap).
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly config: ConfigService,
    @InjectRepository(PlatformAdminEntity)
    private readonly admins: Repository<PlatformAdminEntity>,
  ) {}

  private ownerEmails(): string[] {
    return (this.config.get<string>("PLATFORM_OWNER_EMAILS") ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<PlatformRequest>();
    const token = extractBearer(req);
    if (!token) throw new UnauthorizedException("Sessão inválida.");

    let uid: string;
    let email: string;
    let emailVerified = false;
    try {
      const decoded = await this.firebase.auth().verifyIdToken(token);
      if (!decoded.email) throw new UnauthorizedException("Token sem e-mail.");
      uid = decoded.uid;
      email = decoded.email.toLowerCase();
      emailVerified = decoded.email_verified === true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Sessão expirada. Faça login novamente.");
    }

    // Acesso privilegiado exige e-mail VERIFICADO: sem isso, um invasor poderia
    // cadastrar no Firebase com o e-mail de um gestor (o cadastro não verifica
    // e-mail) e se tornar OWNER via bootstrap/convite. Login com Google já vem
    // verificado. Relaxado nos testes (usuários e2e não têm verificação).
    if (!emailVerified && process.env.NODE_ENV !== "test") {
      throw new ForbiddenException(
        "E-mail não verificado. Entre com Google ou verifique seu e-mail.",
      );
    }

    const admin = await this.resolve(uid, email);
    if (!admin) {
      throw new ForbiddenException("Acesso restrito à equipe de gestores.");
    }
    req.platformAdmin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };
    return true;
  }

  /**
   * Resolve o gestor por `firebaseUid` → e-mail (vinculando o uid); ou provisiona
   * um OWNER quando o e-mail está no allowlist de bootstrap.
   */
  private async resolve(
    uid: string,
    email: string,
  ): Promise<PlatformAdminEntity | null> {
    const byUid = await this.admins.findOne({ where: { firebaseUid: uid } });
    if (byUid) return byUid.active ? byUid : null;

    const byEmail = await this.admins.findOne({ where: { email } });
    if (byEmail) {
      if (!byEmail.active) return null;
      byEmail.firebaseUid = uid;
      return this.admins.save(byEmail);
    }

    if (this.ownerEmails().includes(email)) {
      return this.admins.save(
        this.admins.create({
          email,
          name: email.split("@")[0],
          firebaseUid: uid,
          role: "OWNER",
          active: true,
        }),
      );
    }
    return null;
  }
}
