import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import type { AuthUser } from "../auth/auth-user";
import { TenantContextService } from "./tenant-context.service";

/**
 * Após a autenticação (JwtAuthGuard popula req.user), abre o AsyncLocalStorage
 * com o tenant da requisição para que repositórios e subscriber apliquem o
 * isolamento. Requisições públicas (sem user) seguem sem contexto.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenant: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    return this.tenant.run(
      { companyId: user.companyId, userId: user.id, role: user.role },
      () => next.handle(),
    );
  }
}
