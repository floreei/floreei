import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
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

    try {
      const decoded = await this.firebase.auth().verifyIdToken(token);
      if (!decoded.email) {
        throw new UnauthorizedException("Token sem e-mail.");
      }
      req.firebaseToken = { uid: decoded.uid, email: decoded.email };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Sessão inválida.");
    }
  }
}
