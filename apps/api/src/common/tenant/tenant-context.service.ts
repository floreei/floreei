import { AsyncLocalStorage } from "node:async_hooks";
import { Injectable } from "@nestjs/common";
import type { Role } from "@sistema-flores/types";

export interface TenantContextData {
  companyId: string;
  userId: string;
  role: Role;
}

/**
 * Guarda o contexto do tenant (empresa/usuário autenticado) por requisição,
 * usando AsyncLocalStorage. Repositórios e o subscriber leem daqui para aplicar
 * o isolamento por empresa sem precisar propagar o companyId manualmente.
 */
@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantContextData>();

  run<T>(data: TenantContextData, callback: () => T): T {
    return this.storage.run(data, callback);
  }

  /**
   * Executa `callback` no contexto de uma empresa, sem usuário autenticado —
   * usado por fluxos públicos da loja (resolvidos por slug) e pelo webhook de
   * pagamento, para reusar os repositórios escopados por tenant.
   */
  runForCompany<T>(companyId: string, callback: () => T): T {
    return this.storage.run({ companyId, userId: "", role: "ADMIN" }, callback);
  }

  get(): TenantContextData | undefined {
    return this.storage.getStore();
  }

  getCompanyId(): string | undefined {
    return this.storage.getStore()?.companyId;
  }

  getCompanyIdOrThrow(): string {
    const companyId = this.getCompanyId();
    if (!companyId) {
      throw new Error(
        "TenantContext ausente: nenhuma empresa no contexto da requisição.",
      );
    }
    return companyId;
  }
}
