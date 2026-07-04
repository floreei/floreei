import React from 'react';
import { Label } from '../ui/Label.jsx';

/**
 * Field — envelope de campo: rótulo (com * / (opcional)) + controle + hint + erro.
 * Altura de linha do rótulo controlada para alinhar em grades multi-coluna.
 */
export function Field({ label, htmlFor, required = false, optional = false, hint, error, children, style = {} }) {
  const id = htmlFor || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <div style={{ minHeight: 20, display: 'flex', alignItems: 'center' }}>
          <Label htmlFor={id} required={required} optional={optional}>{label}</Label>
        </div>
      )}
      {React.isValidElement(children) ? React.cloneElement(children, { id, error: !!error }) : children}
      {error ? (
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'hsl(var(--destructive))' }}>{error}</span>
      ) : hint ? (
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>{hint}</span>
      ) : null}
    </div>
  );
}
