import React from 'react';

/** EmptyState — estado vazio com ícone, título, texto e ação. */
export function EmptyState({ icon, title, description, action, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      padding: '48px 24px', gap: 6, ...style }}>
      {icon && (
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56,
          borderRadius: 'var(--radius-full)', background: 'hsl(var(--secondary))', color: 'hsl(var(--primary))', marginBottom: 10 }}>
          {icon}
        </div>
      )}
      {title && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 17, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{title}</div>}
      {description && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'hsl(var(--muted-foreground))', maxWidth: 340 }}>{description}</div>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}
