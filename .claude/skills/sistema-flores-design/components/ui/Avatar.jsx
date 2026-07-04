import React from 'react';

/** Avatar — iniciais ou imagem. Fundo secundário, círculo completo. */
export function Avatar({ src, name = '', size = 36, style = {}, ...rest }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: 'var(--radius-full)', overflow: 'hidden',
      background: 'hsl(var(--secondary))', color: 'hsl(var(--primary))',
      fontFamily: 'var(--font-sans)', fontSize: size * 0.4, fontWeight: 600,
      flexShrink: 0, userSelect: 'none', ...style,
    }} {...rest}>
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (initials || '·')}
    </span>
  );
}
