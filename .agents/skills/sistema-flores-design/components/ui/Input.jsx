import React from 'react';

/**
 * Input — campo de texto base. Altura 44px (alvo de toque), foco com anel duplo.
 * Suporta estado de erro e ícone/afixo à esquerda ou direita.
 */
export function Input({
  error = false,
  leftAddon = null,
  rightAddon = null,
  inputMode,
  selectOnFocus = false,
  style = {},
  onFocus,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? 'hsl(var(--destructive))' : focused ? 'hsl(var(--ring))' : 'hsl(var(--input))';

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        height: 44, padding: '0 12px', background: 'hsl(var(--card))',
        border: `1px solid ${borderColor}`, borderRadius: 'var(--radius-sm)',
        boxShadow: focused ? 'var(--focus-ring)' : 'var(--shadow-xs)',
        transition: 'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
      }}
    >
      {leftAddon && <span style={{ color: 'hsl(var(--muted-foreground))', display: 'inline-flex' }}>{leftAddon}</span>}
      <input
        inputMode={inputMode}
        onFocus={(e) => { setFocused(true); if (selectOnFocus) e.target.select(); onFocus && onFocus(e); }}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
          fontFamily: 'var(--font-sans)', fontSize: 16, color: 'hsl(var(--foreground))',
          height: '100%', ...style,
        }}
        {...rest}
      />
      {rightAddon && <span style={{ color: 'hsl(var(--muted-foreground))', display: 'inline-flex' }}>{rightAddon}</span>}
    </div>
  );
}
