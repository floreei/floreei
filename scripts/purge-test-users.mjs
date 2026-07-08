/**
 * Purga usuários de TESTE do Firebase Auth do projeto.
 *
 * Os e2e batem no Firebase real; o CI se auto-limpa (E2E_CLEANUP_USERS=1),
 * mas rodadas locais/interrompidas deixam contas para trás. Este script lista
 * todas as contas, separa as de teste por padrão de e-mail e as apaga.
 *
 * Uso (requer gcloud autenticado com acesso ao projeto):
 *   node scripts/purge-test-users.mjs            # dry-run (não deleta nada)
 *   node scripts/purge-test-users.mjs --delete   # executa a purga
 *   FIREBASE_PROJECT_ID=<id> node scripts/...    # outro projeto
 */
import { execSync } from "node:child_process";

const PROJECT = process.env.FIREBASE_PROJECT_ID ?? "meuflorista-7dfd5";
const token = execSync(`gcloud auth print-access-token --project ${PROJECT}`, {
  encoding: "utf8",
}).trim();
const BASE = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}`;
const HEADERS = {
  Authorization: `Bearer ${token}`,
  // Credencial de usuário (ADC) exige o quota project explícito.
  "x-goog-user-project": PROJECT,
};

/** Padrões INEQUÍVOCOS de conta de teste — na dúvida, mantém. */
const isTest = (email) => {
  if (!email) return false;
  if (email.endsWith(".test")) return true; // TLD reservado (e2e.flores.test)
  // e2e do web / scripts: prefixo_<timestamp>@flores.com
  if (/^[a-z0-9_.]+_\d{10,13}@flores\.com$/i.test(email)) return true;
  return false;
};

const all = [];
let pageToken = "";
do {
  const url = `${BASE}/accounts:batchGet?maxResults=500${pageToken ? `&nextPageToken=${pageToken}` : ""}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`batchGet ${res.status}: ${await res.text()}`);
  const data = await res.json();
  for (const u of data.users ?? []) {
    all.push({ id: u.localId, email: u.email ?? "(sem email)" });
  }
  pageToken = data.nextPageToken ?? "";
} while (pageToken);

const test = all.filter((u) => isTest(u.email));
const keep = all.filter((u) => !isTest(u.email));

console.log(`TOTAL: ${all.length} | TESTE (deletáveis): ${test.length} | MANTIDOS: ${keep.length}`);
console.log("\n--- MANTIDOS (confira: só deve ter gente real) ---");
keep.forEach((u) => console.log("  KEEP", u.email));

if (!process.argv.includes("--delete")) {
  console.log("\n(dry-run — nada foi deletado; rode com --delete para executar)");
  process.exit(0);
}

console.log(`\nDeletando ${test.length} em lotes de 500...`);
for (let i = 0; i < test.length; i += 500) {
  const batch = test.slice(i, i + 500).map((u) => u.id);
  const res = await fetch(`${BASE}/accounts:batchDelete`, {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ localIds: batch, force: true }),
  });
  if (!res.ok) throw new Error(`batchDelete ${res.status}: ${await res.text()}`);
  const out = await res.json();
  console.log(`  lote ${i / 500 + 1}: ${batch.length}, erros: ${(out.errors ?? []).length}`);
}
console.log("PURGA CONCLUÍDA");
