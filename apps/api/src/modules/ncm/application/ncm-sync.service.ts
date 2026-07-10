import { Injectable, Logger } from "@nestjs/common";
import { NcmRepository } from "../infrastructure/ncm.repository";

const SISCOMEX_URL =
  "https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json";

const CHUNK_SIZE = 500;
/** Marca de "vigente" do Siscomex — sem data-fim definida, ainda em vigor. */
const CURRENT_END_DATE = "31/12/9999";

interface SiscomexEntry {
  Codigo: string;
  Descricao: string;
  Data_Fim: string;
}

interface SiscomexPayload {
  Nomenclaturas: SiscomexEntry[];
}

/** Só dígitos, sem os pontos do formato "0101.21.00". */
function normalizeCode(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Descrições vêm com traços indicando nível ("-- Reprodutores..."). */
function cleanDescription(raw: string): string {
  return raw.replace(/^-+\s*/, "").trim();
}

@Injectable()
export class NcmSyncService {
  private readonly logger = new Logger(NcmSyncService.name);

  constructor(private readonly repo: NcmRepository) {}

  /**
   * Baixa a tabela completa do Portal Único Siscomex (não existe endpoint de
   * busca — só o dump completo) e reconstrói a base local. Cada código folha
   * (8 dígitos) ganha uma descrição hierárquica concatenando os pais de 2→4→6
   * dígitos, porque a descrição da folha sozinha ("Rosas") é vaga sem o
   * contexto do capítulo/posição. Código que não aparecer mais no download
   * como vigente é marcado `active=false` (não removido — pode estar
   * referenciado em produtos já cadastrados).
   */
  async sync(): Promise<{ total: number; active: number }> {
    const res = await fetch(SISCOMEX_URL);
    if (!res.ok) {
      throw new Error(`Falha ao baixar tabela NCM do Siscomex (HTTP ${res.status}).`);
    }
    const payload = (await res.json()) as SiscomexPayload;
    const entries = payload.Nomenclaturas ?? [];

    // Um mesmo código pode aparecer mais de uma vez (versões com vigência
    // diferente) — preferimos a entrada vigente; entre vigentes, a última do
    // arquivo.
    const byCode = new Map<string, SiscomexEntry>();
    for (const entry of entries) {
      const code = normalizeCode(entry.Codigo);
      if (!code) continue;
      const existing = byCode.get(code);
      if (!existing || entry.Data_Fim === CURRENT_END_DATE) {
        byCode.set(code, entry);
      }
    }

    const leafCodes = [...byCode.keys()].filter((code) => code.length === 8);
    const currentLeafCodes = leafCodes.filter(
      (code) => byCode.get(code)!.Data_Fim === CURRENT_END_DATE,
    );

    const toUpsert = currentLeafCodes.map((code) => {
      const leaf = byCode.get(code)!;
      const ancestorCodes = [code.slice(0, 2), code.slice(0, 4), code.slice(0, 6)];
      const parts = [
        ...ancestorCodes.map((c) => byCode.get(c)?.Descricao).filter(Boolean),
        leaf.Descricao,
      ] as string[];
      return {
        code,
        description: cleanDescription(leaf.Descricao),
        hierarchicalDescription: parts.map(cleanDescription).join(" > "),
      };
    });

    for (let i = 0; i < toUpsert.length; i += CHUNK_SIZE) {
      await this.repo.upsertMany(toUpsert.slice(i, i + CHUNK_SIZE));
    }
    await this.repo.deactivateMissing(currentLeafCodes);

    this.logger.log(
      `Sincronização NCM: ${toUpsert.length} códigos vigentes de ${leafCodes.length} folhas no download.`,
    );
    return { total: leafCodes.length, active: toUpsert.length };
  }
}
