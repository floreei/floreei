import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { extractBearer } from "../../../common/auth/firebase-auth.guard";

/**
 * Guarda simples por token estático (bearer) — protege `POST /ncm/sync`, que
 * é chamado pelo Google Cloud Scheduler (não por um usuário logado, a rota é
 * `@Public()` pro guard global do Firebase). Token vive em `NCM_SYNC_TOKEN`.
 */
@Injectable()
export class NcmSyncTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>("NCM_SYNC_TOKEN");
    if (!expected) {
      throw new UnauthorizedException("Sincronização de NCM não configurada.");
    }
    const req = context.switchToHttp().getRequest();
    const token = extractBearer(req);
    if (!token || token !== expected) {
      throw new UnauthorizedException("Token inválido.");
    }
    return true;
  }
}
