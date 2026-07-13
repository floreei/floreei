import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Autentica o callback do Focus NFe. O Focus não assina o payload, então o
 * segredo vai embutido na URL configurada no painel (`?secret=...`) — mesmo
 * padrão do `?company=` usado no webhook do Mercado Pago. Segredo em
 * `FOCUS_NFE_WEBHOOK_SECRET`.
 */
@Injectable()
export class FocusWebhookGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>("FOCUS_NFE_WEBHOOK_SECRET");
    if (!expected) {
      throw new UnauthorizedException("Webhook fiscal não configurado.");
    }
    const req = context.switchToHttp().getRequest();
    const secret = req.query?.secret;
    if (!secret || secret !== expected) {
      throw new UnauthorizedException("Segredo do webhook inválido.");
    }
    return true;
  }
}
