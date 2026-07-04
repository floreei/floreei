import React from 'react';
import { Button } from './Button.jsx';

/**
 * Dialog — modal centralizado com overlay. max-height 90dvh, scroll interno.
 * stickyFooter: rodapé fixo (forms simples). Para conteúdo crítico, deixe false.
 */
export function Dialog({ open, onClose, title, description, children, footer, stickyFooter = true, width = 520 }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        background: 'hsl(165 30% 8% / 0.42)', backdropFilter: 'blur(2px)',
        animation: 'sf-fade var(--duration-base) var(--ease-standard)' }}>
      <style>{`@keyframes sf-fade{from{opacity:0}to{opacity:1}}@keyframes sf-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}`}</style>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: width, maxHeight: '90dvh', display: 'flex', flexDirection: 'column',
          background: 'hsl(var(--popover))', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
          border: '1px solid hsl(var(--border))', overflow: 'hidden', animation: 'sf-pop var(--duration-base) var(--ease-standard)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '22px 24px 0' }}>
          <div>
            {title && <div className="font-serif" style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'hsl(var(--foreground))', lineHeight: 1.2 }}>{title}</div>}
            {description && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'hsl(var(--muted-foreground))', marginTop: 6 }}>{description}</div>}
          </div>
          <button aria-label="Fechar" onClick={onClose}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, flexShrink: 0,
              border: 'none', background: 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{ padding: '18px 24px', overflowY: 'auto', flex: 1, fontFamily: 'var(--font-sans)', fontSize: 15, color: 'hsl(var(--foreground))' }}>
          {children}
        </div>
        {footer && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: '1px solid hsl(var(--border))',
            position: stickyFooter ? 'sticky' : 'static', bottom: 0, background: 'hsl(var(--popover))' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
