import React from 'react';

/** Card — superfície branca flutuante (sombra em camadas, borda quase imperceptível). */
export function Card({ children, style = {}, ...rest }) {
  return (
    <div style={{
      background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))',
      border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-card)', ...style,
    }} {...rest}>
      {children}
    </div>
  );
}

/** Cabeçalho do card: título (sans semibold) + descrição + ação opcional. */
export function CardHeader({ title, description, action, style = {}, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '20px 24px 0', ...style }}>
      <div style={{ minWidth: 0 }}>
        {title && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 600, color: 'hsl(var(--foreground))', lineHeight: 'var(--leading-snug)' }}>{title}</div>}
        {description && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>{description}</div>}
        {children}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

/** Corpo do card (padding 24px). */
export function CardBody({ children, style = {}, ...rest }) {
  return <div style={{ padding: 24, ...style }} {...rest}>{children}</div>;
}

/** Rodapé do card (ações), com separador superior sutil. */
export function CardFooter({ children, style = {}, ...rest }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid hsl(var(--border))', ...style }} {...rest}>
      {children}
    </div>
  );
}
