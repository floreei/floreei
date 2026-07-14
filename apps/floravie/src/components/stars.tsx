// Estrelas com preenchimento fracionado (ex.: 4,8 de 5). Duas camadas: as vazias
// (cor da linha) e as douradas por cima, recortadas na largura proporcional.
export function Stars({ rating }: { rating: number }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  const layer = {
    letterSpacing: ".1em",
    lineHeight: 1,
  } as const;
  return (
    <span
      className="star-rating"
      role="img"
      aria-label={`${rating.toFixed(1).replace(".", ",")} de 5`}
    >
      <span className="star-rating-base" style={layer}>
        ★★★★★
      </span>
      <span
        className="star-rating-fill"
        style={{ ...layer, width: `${pct}%` }}
        aria-hidden="true"
      >
        ★★★★★
      </span>
    </span>
  );
}
