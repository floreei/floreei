import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Feature } from "@sistema-flores/types";
import type { AuthRequest } from "./firebase-auth.guard";

export const REQUIRES_FEATURE_KEY = "requires_feature";

/**
 * Exige uma feature do plano para acessar o controller/rota. Bloqueia com 403
 * `FEATURE_LOCKED` quando a empresa não a possui — mesmo chamando a API direto.
 * Lê `req.user.features`, que o FirebaseAuthGuard já resolveu (tier + overrides
 * + trial). Aplica o guard junto com a metadata.
 */
export function RequiresFeature(feature: Feature) {
  return applyDecorators(
    SetMetadata(REQUIRES_FEATURE_KEY, feature),
    UseGuards(FeatureGuard),
  );
}

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Feature>(
      REQUIRES_FEATURE_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!required) return true;

    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    const features = req.user?.features ?? [];
    if (!features.includes(required)) {
      throw new ForbiddenException({
        statusCode: 403,
        code: "FEATURE_LOCKED",
        feature: required,
        message: "Recurso não incluído no seu plano.",
      });
    }
    return true;
  }
}
