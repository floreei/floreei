import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  createParamDecorator,
} from "@nestjs/common";
import type {
  PlatformAdminContext,
  PlatformRequest,
} from "./platform-admin.guard";

/** Injeta o gestor autenticado (resolvido pelo PlatformAdminGuard). */
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PlatformAdminContext => {
    const admin = ctx.switchToHttp().getRequest<PlatformRequest>().platformAdmin;
    if (!admin) throw new ForbiddenException("Gestor não autenticado.");
    return admin;
  },
);

/** Restringe a rota ao gestor OWNER (usar após o PlatformAdminGuard). */
@Injectable()
export class PlatformOwnerGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const admin = ctx.switchToHttp().getRequest<PlatformRequest>().platformAdmin;
    if (admin?.role !== "OWNER") {
      throw new ForbiddenException("Apenas um gestor OWNER pode fazer isso.");
    }
    return true;
  }
}
