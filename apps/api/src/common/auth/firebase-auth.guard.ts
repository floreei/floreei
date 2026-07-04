import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "../../modules/users/infrastructure/user.entity";
import { FirebaseService } from "../firebase/firebase.service";
import type { AuthUser } from "./auth-user";
import { IS_PUBLIC_KEY } from "./public.decorator";

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

    let uid: string;
    try {
      uid = (await this.firebase.auth().verifyIdToken(token)).uid;
    } catch {
      throw new UnauthorizedException("Sessão expirada. Faça login novamente.");
    }

    const user = await this.users.findOne({ where: { firebaseUid: uid } });
    if (!user || !user.active) {
      throw new UnauthorizedException("Conta não encontrada.");
    }

    req.user = {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
    };
    return true;
  }
}
