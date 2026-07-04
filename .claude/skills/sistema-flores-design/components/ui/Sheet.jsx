import React from 'react';

/** Sheet — painel deslizante lateral (filtros, detalhes). side left|right. */
export function Sheet({ open, onClose, title, description, children, footer, side = 'right', width = 420 }) {
  if (!open) return null;
  const fromX = side === 'right' ? '100%' : '-100%';
  return (
    <div role="dialog" aria-modal="true" onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'hsl(165 30% 8% / 0.42)',
        backdropFilter: 'blur(2px)', animation: 'sf-fade var(--duration-base) var(--ease-standard)' }}>
      <style>{`@keyframes sf-fade{from{opacity:0}to{opacity:1}}@keyframes sf-slide{from{transform:translateX(${fromX})}to{transform:none}}`}</style>
      <div onClick={(e) => e.stopPropagation()}
        style={{ position: 'absolute', top: 0, bottom: 0, [side]: 0, width: '100%', maxWidth: width,
          display: 'flex', flexDirection: 'column', background: 'hsl(var(--card))', boxShadow: 'var(--shadow-lg)',
          borderLeft: side === 'right' ? '1px solid hsl(var(--border))' : 'none',
          borderRight: side === 'left' ? '1px solid hsl(var(--border))' : 'none',
          animation: 'sf-slide var(--duration-base) var(--ease-standard)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '20px 22px', borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            {title && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{title}</div>}
            {description && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>{description}</div>}
          </div>
          <button aria-label="Fechar" onClick={onClose}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, flexShrink: 0,
              border: 'none', background: 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{ padding: 22, overflowY: 'auto', flex: 1, fontFamily: 'var(--font-sans)', fontSize: 15, color: 'hsl(var(--foreground))' }}>{children}</div>
        {footer && <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '14px 22px', borderTop: '1px solid hsl(var(--border))' }}>{footer}</div>}
      </div>
    </div>
  );
}
