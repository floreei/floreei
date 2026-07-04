import React from 'react';

/** Separator — divisória fina. orientation horizontal (padrão) ou vertical. */
export function Separator({ orientation = 'horizontal', style = {}, ...rest }) {
  const isV = orientation === 'vertical';
  return (
    <div role="separator" aria-orientation={orientation} style={{
      background: 'hsl(var(--border))', flexShrink: 0,
      width: isV ? 1 : '100%', height: isV ? '100%' : 1, ...style,
    }} {...rest} />
  );
}
