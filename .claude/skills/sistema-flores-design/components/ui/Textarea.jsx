import React from 'react';

/** Textarea — texto de múltiplas linhas (observações, descrições). */
export function Textarea({ error = false, rows = 4, style = {}, onFocus, ...rest }) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? 'hsl(var(--destructive))' : focused ? 'hsl(var(--ring))' : 'hsl(var(--input))';
  return (
    <textarea
      rows={rows}
      onFocus={(e) => { setFocused(true); onFocus && onFocus(e); }}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '10px 12px', background: 'hsl(var(--card))',
        border: `1px solid ${borderColor}`, borderRadius: 'var(--radius-sm)',
        boxShadow: focused ? 'var(--focus-ring)' : 'var(--shadow-xs)',
        fontFamily: 'var(--font-sans)', fontSize: 16, lineHeight: 'var(--leading-normal)',
        color: 'hsl(var(--foreground))', outline: 'none', resize: 'vertical',
        transition: 'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
        ...style,
      }}
      {...rest}
    />
  );
}
