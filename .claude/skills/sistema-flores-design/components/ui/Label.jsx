import React from 'react';

/** Label — rótulo de campo. leading-none evita desalinhamento em grades. */
export function Label({ children, htmlFor, required = false, optional = false, style = {}, ...rest }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'inline-flex', alignItems: 'baseline', gap: 4,
        fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
        lineHeight: 'var(--leading-none)', color: 'hsl(var(--foreground))', ...style,
      }}
      {...rest}
    >
      {children}
      {required && <span style={{ color: 'hsl(var(--destructive))', lineHeight: 'var(--leading-none)' }} aria-hidden="true">*</span>}
      {optional && !required && <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 400, fontSize: 13 }}>(opcional)</span>}
    </label>
  );
}
