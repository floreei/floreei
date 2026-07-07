import { SetMetadata } from "@nestjs/common";

export const ALLOW_BLOCKED_COMPANY_KEY = "allow_blocked_company";

/**
 * Deixa a rota acessível mesmo com a empresa bloqueada (trial expirado ou
 * pagamento vencido) — o usuário continua autenticado. É o que permite ao
 * administrador assinar/regularizar a partir da tela de bloqueio. Empresa
 * SUSPENSA (bloqueio manual do gestor) continua barrada.
 */
export const AllowBlockedCompany = () =>
  SetMetadata(ALLOW_BLOCKED_COMPANY_KEY, true);
