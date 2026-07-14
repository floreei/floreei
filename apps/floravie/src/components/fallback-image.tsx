"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { FlowerFallback } from "./icons";

// Reproduz attachImgFallback() da referência: se a imagem falhar ao carregar,
// mostra um degradê #F4E4E4→#EFE6DA com a flor SVG centralizada, preenchendo o
// container posicionado (.ph, .pd-img, .hero-photo — todos position:relative).
type Props = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  loading?: "eager" | "lazy";
};

export function FallbackImage({ src, alt, className, style, loading = "lazy" }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(170deg,#F4E4E4,#EFE6DA)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <FlowerFallback />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      onError={() => setFailed(true)}
    />
  );
}
