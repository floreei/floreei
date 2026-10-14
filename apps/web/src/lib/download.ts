/** Dispara o download de um Blob com o nome dado (link temporário, revogado depois). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Dá tempo do navegador abrir o stream antes de soltar a URL.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Copia texto para a área de transferência; false quando o navegador não deixa. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
