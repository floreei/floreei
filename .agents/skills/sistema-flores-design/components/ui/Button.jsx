import React from 'react';

/**
 * Button — ação primária do Sistema Flores.
 * Variantes botânicas: primary (pinho), secondary, ghost, outline, clay (ênfase),
 * destructive. Estado de loading com spinner. Alvos de toque generosos.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  type = 'button',
  children,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: { height: 36, padding: '0 12px', fontSize: 14, gap: 6, radius: 'var(--radius-sm)' },
    md: { height: 44, padding: '0 18px', fontSize: 15, gap: 8, radius: 'var(--radius-md)' },
    lg: { height: 48, padding: '0 24px', fontSize: 16, gap: 8, radius: 'var(--radius-md)' },
  };
  const s = sizes[size] || sizes.md;

  const variants = {
    primary: { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', border: '1px solid transparent', boxShadow: 'var(--shadow-xs)' },
    secondary: { background: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))', border: '1px solid transparent' },
    ghost: { background: 'transparent', color: 'hsl(var(--foreground))', border: '1px solid transparent' },
    outline: { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--input))', boxShadow: 'var(--shadow-xs)' },
    clay: { background: 'hsl(var(--clay))', color: 'hsl(var(--clay-foreground))', border: '1px solid transparent', boxShadow: 'var(--shadow-xs)' },
    destructive: { background: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))', border: '1px solid transparent', boxShadow: 'var(--shadow-xs)' },
  };
  const v = variants[variant] || variants.primary;
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: s.gap, height: s.height, minHeight: s.height, padding: s.padding,
        fontFamily: 'var(--font-sans)', fontSize: s.fontSize, fontWeight: 600,
        lineHeight: 1, borderRadius: s.radius, cursor: isDisabled ? 'not-allowed' : 'pointer',
        width: fullWidth ? '100%' : 'auto', opacity: isDisabled ? 0.55 : 1,
        transition: 'background var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
        whiteSpace: 'nowrap', ...v, ...style,
      }}
      {...rest}
    >
      {loading && <Spinner />}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 16, height: 16, borderRadius: '50%',
        border: '2px solid currentColor', borderTopColor: 'transparent',
        display: 'inline-block', animation: 'sf-spin 0.7s linear infinite',
      }}
    >
      <style>{`@keyframes sf-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}
