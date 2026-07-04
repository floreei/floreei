import React from 'react';

/** Badge — etiqueta compacta. Variantes tonais suaves (não saturadas). */
export function Badge({ variant = 'neutral', children, style = {}, ...rest }) {
  const variants = {
    neutral: { background: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' },
    primary: { background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' },
    clay: { background: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' },
    success: { background: 'hsl(var(--success) / 0.14)', color: 'hsl(var(--success))' },
    warning: { background: 'hsl(var(--warning) / 0.16)', color: 'hsl(32 60% 32%)' },
    destructive: { background: 'hsl(var(--destructive) / 0.14)', color: 'hsl(var(--destructive))' },
    outline: { background: 'transparent', color: 'hsl(var(--muted-foreground))', boxShadow: 'inset 0 0 0 1px hsl(var(--border))' },
  };
  const v = variants[variant] || variants.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: 22, padding: '0 9px', borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600,
      lineHeight: 1, whiteSpace: 'nowrap', ...v, ...style,
    }} {...rest}>
      {children}
    </span>
  );
}
