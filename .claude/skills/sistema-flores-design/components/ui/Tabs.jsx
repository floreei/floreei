import React from 'react';

/**
 * Tabs — navegação por abas. items: [{ value, label, icon? }].
 * Controlado (value + onValueChange) ou não-controlado (defaultValue).
 */
export function Tabs({ items = [], value, defaultValue, onValueChange, style = {} }) {
  const [internal, setInternal] = React.useState(defaultValue ?? (items[0] && items[0].value));
  const active = value != null ? value : internal;
  function select(v) { if (value == null) setInternal(v); onValueChange && onValueChange(v); }
  return (
    <div role="tablist" style={{ display: 'inline-flex', gap: 2, padding: 4, background: 'hsl(var(--muted))', borderRadius: 'var(--radius-md)', ...style }}>
      {items.map((it) => {
        const on = it.value === active;
        return (
          <button key={it.value} role="tab" aria-selected={on} onClick={() => select(it.value)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px',
              border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
              background: on ? 'hsl(var(--card))' : 'transparent',
              color: on ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              boxShadow: on ? 'var(--shadow-xs)' : 'none',
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
              transition: 'background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)',
            }}>
            {it.icon}{it.label}
          </button>
        );
      })}
    </div>
  );
}
