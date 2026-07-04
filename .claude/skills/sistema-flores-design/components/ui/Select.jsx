import React from 'react';

/**
 * Select — seleção nativa estilizada (acessível, teclado/leitor de tela).
 * Options: [{ value, label }] ou children <option>.
 */
export function Select({ error = false, options = null, placeholder, style = {}, onFocus, children, ...rest }) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? 'hsl(var(--destructive))' : focused ? 'hsl(var(--ring))' : 'hsl(var(--input))';
  return (
    <div style={{ position: 'relative', display: 'flex' }}>
      <select
        onFocus={(e) => { setFocused(true); onFocus && onFocus(e); }}
        onBlur={() => setFocused(false)}
        style={{
          appearance: 'none', WebkitAppearance: 'none', width: '100%', height: 44,
          padding: '0 40px 0 12px', background: 'hsl(var(--card))',
          border: `1px solid ${borderColor}`, borderRadius: 'var(--radius-sm)',
          boxShadow: focused ? 'var(--focus-ring)' : 'var(--shadow-xs)',
          fontFamily: 'var(--font-sans)', fontSize: 16, color: 'hsl(var(--foreground))',
          outline: 'none', cursor: 'pointer',
          transition: 'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
          ...style,
        }}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options ? options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>) : children}
      </select>
      <span aria-hidden="true" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'hsl(var(--muted-foreground))', display: 'inline-flex' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </span>
    </div>
  );
}
