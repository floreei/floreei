import { Injectable } from "@nestjs/common";
import type {
  NfeCancelResult,
  NfeEmissionResult,
  NfeProviderPort,
  NfeStatusResult,
} from "../ports/nfe-provider.port";

const NAO_CONFIGURADO =
  "Provedor de nota fiscal não configurado. Fale com o suporte da Floreei para habilitar a emissão.";

/**
 * Provedor padrão enquanto nenhum provedor real de NFe está contratado.
 * Nunca lança exceção — sempre resolve com um resultado tratado, pra que a
 * venda nunca quebre por causa da nota fiscal.
 */
@Injectable()
export class StubNfeProvider implements NfeProviderPort {
  readonly name = "STUB";

  async emit(): Promise<NfeEmissionResult> {
    return { status: "REJECTED", rejectionReason: NAO_CONFIGURADO, raw: null };
  }

  async cancel(): Promise<NfeCancelResult> {
    return { status: "REJECTED", cancelReason: NAO_CONFIGURADO, raw: null };
  }

  async checkStatus(): Promise<NfeStatusResult> {
    return { status: "REJECTED", rejectionReason: NAO_CONFIGURADO };
  }
}
