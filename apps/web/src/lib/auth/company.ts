// Empresa escolhida no login multi-conta. Vai no header `x-company-id` de toda
// requisição; o backend valida o vínculo do usuário com essa empresa.
const KEY = "floreei:companyId";

export function getSelectedCompanyId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function setSelectedCompanyId(companyId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, companyId);
}

export function clearSelectedCompanyId(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
