/**
 * Vídeo de boas-vindas — a URL vem de env (`NEXT_PUBLIC_WELCOME_VIDEO_URL`).
 * Vazia → mostra só a capa animada da marca. Basta preencher a env depois
 * (YouTube, Vimeo, Loom ou um arquivo .mp4) que o player embuta sozinho.
 */
export const WELCOME_VIDEO_URL = process.env.NEXT_PUBLIC_WELCOME_VIDEO_URL ?? "";

export type ResolvedVideo =
  | { kind: "file"; src: string }
  | { kind: "embed"; src: string }
  | null;

/** Normaliza a URL para algo tocável (arquivo direto ou iframe de embed). */
export function resolveVideo(url: string): ResolvedVideo {
  const value = url.trim();
  if (!value) return null;

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(value)) {
    return { kind: "file", src: value };
  }
  const yt = value.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/,
  );
  if (yt) {
    return {
      kind: "embed",
      src: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`,
    };
  }
  const vimeo = value.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return { kind: "embed", src: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1` };
  }
  const loom = value.match(/loom\.com\/(?:share|embed)\/([\w-]+)/);
  if (loom) {
    return { kind: "embed", src: `https://www.loom.com/embed/${loom[1]}?autoplay=1` };
  }
  // Qualquer outra URL: tenta como iframe direto.
  return { kind: "embed", src: value };
}
