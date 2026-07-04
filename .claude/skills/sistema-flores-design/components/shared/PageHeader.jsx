import React from 'react';

/**
 * PageHeader — cabeçalho de página: título serif (Fraunces ~2rem) + descrição + ações.
 */
export function PageHeader({ title, description, actions, eyebrow, style = {} }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 24, ...style }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>{eyebrow}</div>}
        <h1 className="font-serif" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontOpticalSizing: 'auto', fontVariationSettings: "'SOFT' 40",
          fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15, color: 'hsl(var(--foreground))' }}>{title}</h1>
        {description && <p style={{ margin: '8px 0 0', fontFamily: 'var(--font-sans)', fontSize: 15, color: 'hsl(var(--muted-foreground))', maxWidth: 560 }}>{description}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}
