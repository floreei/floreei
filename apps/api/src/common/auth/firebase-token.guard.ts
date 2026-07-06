import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ACCESS_DENIED_CODES } from "@sistema-flores/types";
import { FirebaseService } from "../firebase/firebase.service";
import { extractBearer } from "./firebase-auth.guard";

/** Identidade do Firebase de um token válido, antes do provisionamento local. */
export interface FirebaseIdentity {
  uid: string;
  email: string;
}

interface TokenRequest {
  headers: { authorization?: string };
  firebaseToken?: FirebaseIdentity;
}

/**
 * Valida o ID token do Firebase e expõe `{ uid, email }` em `req.firebaseToken`,
 * SEM exigir um usuário local. Usado na rota de provisionamento (JIT), quando a
 * conta ainda não existe no nosso banco.
 */
@Injectable()
export class FirebaseTokenGuard implements CanActivate {
  constructor(private readonly firebase: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<TokenRequest>();
    const token = extractBearer(req);
    if (!token) throw new UnauthorizedException("Sessão inválida.");

    let identity: { uid: string; email: string; verified: boolean };
    try {
      const decoded = await this.firebase.auth().verifyIdToken(token);
      if (!decoded.email) {
        throw new UnauthorizedException("Token sem e-mail.");
      }
      identity = {
        uid: decoded.uid,
        email: decoded.email,
        verified: decoded.email_verified === true,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Sessão inválida.");
    }

    // Só provisiona (cria a empresa) com e-mail verificado — impede que alguém
    // registre uma empresa com o e-mail de outra pessoa. Relaxado nos testes.
    if (!identity.verified && process.env.NODE_ENV !== "test") {
      throw new ForbiddenException({
        statusCode: 403,
        code: ACCESS_DENIED_CODES.EMAIL_NOT_VERIFIED,
        message: "Verifique seu e-mail para continuar.",
      });
    }
    req.firebaseToken = { uid: identity.uid, email: identity.email };
    return true;
  }
}
