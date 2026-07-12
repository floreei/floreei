import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { extractBearer } from "../../../common/auth/firebase-auth.guard";

/**
 * Token estático (bearer) para `POST /dunning/run` — chamado 1×/dia pelo Cloud
 * Scheduler (rota `@Public()`, sem usuário logado). Token em `DUNNING_RUN_TOKEN`.
 * Mesmo padrão do `NcmSyncTokenGuard`.
 */
@Injectable()
export class DunningRunTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>("DUNNING_RUN_TOKEN");
    if (!expected) {
      throw new UnauthorizedException("Régua de cobrança não configurada.");
    }
    const req = context.switchToHttp().getRequest();
    const token = extractBearer(req);
    if (!token || token !== expected) {
      throw new UnauthorizedException("Token inválido.");
    }
    return true;
  }
}
