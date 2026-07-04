import React from 'react';

/** Skeleton — placeholder de carregamento com shimmer suave. */
export function Skeleton({ width = '100%', height = 16, radius = 'var(--radius-sm)', style = {}, ...rest }) {
  return (
    <span style={{
      display: 'block', width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--secondary)) 37%, hsl(var(--muted)) 63%)',
      backgroundSize: '400% 100%', animation: 'sf-shimmer 1.4s ease infinite', ...style,
    }} {...rest}>
      <style>{`@keyframes sf-shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }`}</style>
    </span>
  );
}
