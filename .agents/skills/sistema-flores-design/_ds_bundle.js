/* @ds-bundle: {"format":4,"namespace":"SistemaFloresDesignSystem_d212f4","components":[{"name":"ConfirmDialog","sourcePath":"components/shared/ConfirmDialog.jsx"},{"name":"EmptyState","sourcePath":"components/shared/EmptyState.jsx"},{"name":"Field","sourcePath":"components/shared/Field.jsx"},{"name":"PageHeader","sourcePath":"components/shared/PageHeader.jsx"},{"name":"Avatar","sourcePath":"components/ui/Avatar.jsx"},{"name":"Badge","sourcePath":"components/ui/Badge.jsx"},{"name":"Button","sourcePath":"components/ui/Button.jsx"},{"name":"Card","sourcePath":"components/ui/Card.jsx"},{"name":"CardHeader","sourcePath":"components/ui/Card.jsx"},{"name":"CardBody","sourcePath":"components/ui/Card.jsx"},{"name":"CardFooter","sourcePath":"components/ui/Card.jsx"},{"name":"CurrencyInput","sourcePath":"components/ui/CurrencyInput.jsx"},{"name":"Dialog","sourcePath":"components/ui/Dialog.jsx"},{"name":"DropdownMenu","sourcePath":"components/ui/DropdownMenu.jsx"},{"name":"Input","sourcePath":"components/ui/Input.jsx"},{"name":"Label","sourcePath":"components/ui/Label.jsx"},{"name":"Select","sourcePath":"components/ui/Select.jsx"},{"name":"Separator","sourcePath":"components/ui/Separator.jsx"},{"name":"Sheet","sourcePath":"components/ui/Sheet.jsx"},{"name":"Skeleton","sourcePath":"components/ui/Skeleton.jsx"},{"name":"StatusBadge","sourcePath":"components/ui/StatusBadge.jsx"},{"name":"Table","sourcePath":"components/ui/Table.jsx"},{"name":"Tabs","sourcePath":"components/ui/Tabs.jsx"},{"name":"Textarea","sourcePath":"components/ui/Textarea.jsx"}],"sourceHashes":{"components/shared/ConfirmDialog.jsx":"8bbbfa3f4232","components/shared/EmptyState.jsx":"6a8b6e92e3b1","components/shared/Field.jsx":"87ed74fa5b32","components/shared/PageHeader.jsx":"9870c129a33b","components/ui/Avatar.jsx":"89779d26214f","components/ui/Badge.jsx":"c10fd3288c5a","components/ui/Button.jsx":"68862ea73515","components/ui/Card.jsx":"8d173cba9f79","components/ui/CurrencyInput.jsx":"371d8f2ab3e0","components/ui/Dialog.jsx":"2cc2466c850d","components/ui/DropdownMenu.jsx":"dfb63934ba5c","components/ui/Input.jsx":"e0ce15c41982","components/ui/Label.jsx":"306c2df26447","components/ui/Select.jsx":"74261e14983a","components/ui/Separator.jsx":"9ea35d71b079","components/ui/Sheet.jsx":"8364b64681f4","components/ui/Skeleton.jsx":"0ed69830db05","components/ui/StatusBadge.jsx":"f39b1631ee50","components/ui/Table.jsx":"16727f1dc9e9","components/ui/Tabs.jsx":"b40bb09046dd","components/ui/Textarea.jsx":"bda2b7ea03c2","ui_kits/erp/FinanceiroScreen.jsx":"b78a24ef85e1","ui_kits/erp/Icons.jsx":"9fafb49ec0d9","ui_kits/erp/OrcamentosScreen.jsx":"ff39635ad33e","ui_kits/erp/PainelScreen.jsx":"05f58cbcf129","ui_kits/erp/Sidebar.jsx":"bcd2540b366d","ui_kits/erp/Topbar.jsx":"2e51ce60510e"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.SistemaFloresDesignSystem_d212f4 = window.SistemaFloresDesignSystem_d212f4 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/shared/EmptyState.jsx
try { (() => {
/** EmptyState — estado vazio com ícone, título, texto e ação. */
function EmptyState({
  icon,
  title,
  description,
  action,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: '48px 24px',
      gap: 6,
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 56,
      height: 56,
      borderRadius: 'var(--radius-full)',
      background: 'hsl(var(--secondary))',
      color: 'hsl(var(--primary))',
      marginBottom: 10
    }
  }, icon), title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 17,
      fontWeight: 600,
      color: 'hsl(var(--foreground))'
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'hsl(var(--muted-foreground))',
      maxWidth: 340
    }
  }, description), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, action));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shared/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/shared/PageHeader.jsx
try { (() => {
/**
 * PageHeader — cabeçalho de página: título serif (Fraunces ~2rem) + descrição + ações.
 */
function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 20,
      flexWrap: 'wrap',
      marginBottom: 24,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontSize: 12,
      fontWeight: 600,
      color: 'hsl(var(--muted-foreground))',
      marginBottom: 6
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h1", {
    className: "font-serif",
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontOpticalSizing: 'auto',
      fontVariationSettings: "'SOFT' 40",
      fontSize: 32,
      fontWeight: 600,
      letterSpacing: '-0.02em',
      lineHeight: 1.15,
      color: 'hsl(var(--foreground))'
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      color: 'hsl(var(--muted-foreground))',
      maxWidth: 560
    }
  }, description)), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexShrink: 0
    }
  }, actions));
}
Object.assign(__ds_scope, { PageHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shared/PageHeader.jsx", error: String((e && e.message) || e) }); }

// components/ui/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Avatar — iniciais ou imagem. Fundo secundário, círculo completo. */
function Avatar({
  src,
  name = '',
  size = 36,
  style = {},
  ...rest
}) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: 'var(--radius-full)',
      overflow: 'hidden',
      background: 'hsl(var(--secondary))',
      color: 'hsl(var(--primary))',
      fontFamily: 'var(--font-sans)',
      fontSize: size * 0.4,
      fontWeight: 600,
      flexShrink: 0,
      userSelect: 'none',
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials || '·');
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ui/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/ui/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Badge — etiqueta compacta. Variantes tonais suaves (não saturadas). */
function Badge({
  variant = 'neutral',
  children,
  style = {},
  ...rest
}) {
  const variants = {
    neutral: {
      background: 'hsl(var(--secondary))',
      color: 'hsl(var(--secondary-foreground))'
    },
    primary: {
      background: 'hsl(var(--primary) / 0.12)',
      color: 'hsl(var(--primary))'
    },
    clay: {
      background: 'hsl(var(--accent))',
      color: 'hsl(var(--accent-foreground))'
    },
    success: {
      background: 'hsl(var(--success) / 0.14)',
      color: 'hsl(var(--success))'
    },
    warning: {
      background: 'hsl(var(--warning) / 0.16)',
      color: 'hsl(32 60% 32%)'
    },
    destructive: {
      background: 'hsl(var(--destructive) / 0.14)',
      color: 'hsl(var(--destructive))'
    },
    outline: {
      background: 'transparent',
      color: 'hsl(var(--muted-foreground))',
      boxShadow: 'inset 0 0 0 1px hsl(var(--border))'
    }
  };
  const v = variants[variant] || variants.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      height: 22,
      padding: '0 9px',
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-sans)',
      fontSize: 12.5,
      fontWeight: 600,
      lineHeight: 1,
      whiteSpace: 'nowrap',
      ...v,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ui/Badge.jsx", error: String((e && e.message) || e) }); }

// components/ui/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — ação primária do Sistema Flores.
 * Variantes botânicas: primary (pinho), secondary, ghost, outline, clay (ênfase),
 * destructive. Estado de loading com spinner. Alvos de toque generosos.
 */
function Button({
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
    sm: {
      height: 36,
      padding: '0 12px',
      fontSize: 14,
      gap: 6,
      radius: 'var(--radius-sm)'
    },
    md: {
      height: 44,
      padding: '0 18px',
      fontSize: 15,
      gap: 8,
      radius: 'var(--radius-md)'
    },
    lg: {
      height: 48,
      padding: '0 24px',
      fontSize: 16,
      gap: 8,
      radius: 'var(--radius-md)'
    }
  };
  const s = sizes[size] || sizes.md;
  const variants = {
    primary: {
      background: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      border: '1px solid transparent',
      boxShadow: 'var(--shadow-xs)'
    },
    secondary: {
      background: 'hsl(var(--secondary))',
      color: 'hsl(var(--secondary-foreground))',
      border: '1px solid transparent'
    },
    ghost: {
      background: 'transparent',
      color: 'hsl(var(--foreground))',
      border: '1px solid transparent'
    },
    outline: {
      background: 'hsl(var(--card))',
      color: 'hsl(var(--foreground))',
      border: '1px solid hsl(var(--input))',
      boxShadow: 'var(--shadow-xs)'
    },
    clay: {
      background: 'hsl(var(--clay))',
      color: 'hsl(var(--clay-foreground))',
      border: '1px solid transparent',
      boxShadow: 'var(--shadow-xs)'
    },
    destructive: {
      background: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
      border: '1px solid transparent',
      boxShadow: 'var(--shadow-xs)'
    }
  };
  const v = variants[variant] || variants.primary;
  const isDisabled = disabled || loading;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: isDisabled,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.height,
      minHeight: s.height,
      padding: s.padding,
      fontFamily: 'var(--font-sans)',
      fontSize: s.fontSize,
      fontWeight: 600,
      lineHeight: 1,
      borderRadius: s.radius,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      width: fullWidth ? '100%' : 'auto',
      opacity: isDisabled ? 0.55 : 1,
      transition: 'background var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
      whiteSpace: 'nowrap',
      ...v,
      ...style
    }
  }, rest), loading && /*#__PURE__*/React.createElement(Spinner, null), !loading && leftIcon, children, !loading && rightIcon);
}
function Spinner() {
  return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 16,
      height: 16,
      borderRadius: '50%',
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      display: 'inline-block',
      animation: 'sf-spin 0.7s linear infinite'
    }
  }, /*#__PURE__*/React.createElement("style", null, `@keyframes sf-spin { to { transform: rotate(360deg); } }`));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ui/Button.jsx", error: String((e && e.message) || e) }); }

// components/ui/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Card — superfície branca flutuante (sombra em camadas, borda quase imperceptível). */
function Card({
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'hsl(var(--card))',
      color: 'hsl(var(--card-foreground))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-card)',
      ...style
    }
  }, rest), children);
}

/** Cabeçalho do card: título (sans semibold) + descrição + ação opcional. */
function CardHeader({
  title,
  description,
  action,
  style = {},
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      padding: '20px 24px 0',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 20,
      fontWeight: 600,
      color: 'hsl(var(--foreground))',
      lineHeight: 'var(--leading-snug)'
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'hsl(var(--muted-foreground))',
      marginTop: 4
    }
  }, description), children), action && /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0
    }
  }, action));
}

/** Corpo do card (padding 24px). */
function CardBody({
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      padding: 24,
      ...style
    }
  }, rest), children);
}

/** Rodapé do card (ações), com separador superior sutil. */
function CardFooter({
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 10,
      padding: '16px 24px',
      borderTop: '1px solid hsl(var(--border))',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card, CardHeader, CardBody, CardFooter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ui/Card.jsx", error: String((e && e.message) || e) }); }

// components/ui/Dialog.jsx
try { (() => {
/**
 * Dialog — modal centralizado com overlay. max-height 90dvh, scroll interno.
 * stickyFooter: rodapé fixo (forms simples). Para conteúdo crítico, deixe false.
 */
function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  stickyFooter = true,
  width = 520
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-label": typeof title === 'string' ? title : undefined,
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      background: 'hsl(165 30% 8% / 0.42)',
      backdropFilter: 'blur(2px)',
      animation: 'sf-fade var(--duration-base) var(--ease-standard)'
    }
  }, /*#__PURE__*/React.createElement("style", null, `@keyframes sf-fade{from{opacity:0}to{opacity:1}}@keyframes sf-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}`), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      maxWidth: width,
      maxHeight: '90dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'hsl(var(--popover))',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-lg)',
      border: '1px solid hsl(var(--border))',
      overflow: 'hidden',
      animation: 'sf-pop var(--duration-base) var(--ease-standard)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      padding: '22px 24px 0'
    }
  }, /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("div", {
    className: "font-serif",
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: 24,
      fontWeight: 600,
      color: 'hsl(var(--foreground))',
      lineHeight: 1.2
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'hsl(var(--muted-foreground))',
      marginTop: 6
    }
  }, description)), /*#__PURE__*/React.createElement("button", {
    "aria-label": "Fechar",
    onClick: onClose,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      height: 36,
      flexShrink: 0,
      border: 'none',
      background: 'transparent',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      color: 'hsl(var(--muted-foreground))'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 24px',
      overflowY: 'auto',
      flex: 1,
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      color: 'hsl(var(--foreground))'
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      padding: '14px 24px',
      borderTop: '1px solid hsl(var(--border))',
      position: stickyFooter ? 'sticky' : 'static',
      bottom: 0,
      background: 'hsl(var(--popover))'
    }
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ui/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/shared/ConfirmDialog.jsx
try { (() => {
/**
 * ConfirmDialog — confirmação de ação (geralmente destrutiva).
 * Rodapé NÃO-sticky para não esconder o texto crítico.
 */
function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Dialog, {
    open: open,
    onClose: onClose,
    title: title,
    description: description,
    stickyFooter: false,
    width: 440,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(__ds_scope.Button, {
      variant: "ghost",
      onClick: onClose,
      disabled: loading
    }, cancelLabel), /*#__PURE__*/React.createElement(__ds_scope.Button, {
      variant: destructive ? 'destructive' : 'primary',
      loading: loading,
      onClick: onConfirm
    }, confirmLabel))
  });
}
Object.assign(__ds_scope, { ConfirmDialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shared/ConfirmDialog.jsx", error: String((e && e.message) || e) }); }

// components/ui/DropdownMenu.jsx
try { (() => {
/**
 * DropdownMenu — menu de ações ancorado a um gatilho.
 * items: [{ label, icon?, onClick, destructive?, separator? }].
 */
function DropdownMenu({
  trigger,
  items = [],
  align = 'end'
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      position: 'relative',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => setOpen(o => !o),
    style: {
      display: 'inline-flex'
    }
  }, trigger), open && /*#__PURE__*/React.createElement("div", {
    role: "menu",
    style: {
      position: 'absolute',
      top: 'calc(100% + 6px)',
      [align === 'end' ? 'right' : 'left']: 0,
      zIndex: 40,
      minWidth: 200,
      padding: 6,
      background: 'hsl(var(--popover))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      animation: 'sf-pop var(--duration-fast) var(--ease-standard)'
    }
  }, /*#__PURE__*/React.createElement("style", null, `@keyframes sf-pop{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}`), items.map((it, i) => it.separator ? /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      height: 1,
      background: 'hsl(var(--border))',
      margin: '6px 0'
    }
  }) : /*#__PURE__*/React.createElement("button", {
    key: i,
    role: "menuitem",
    onClick: () => {
      setOpen(false);
      it.onClick && it.onClick();
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      height: 40,
      padding: '0 10px',
      border: 'none',
      background: 'transparent',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      textAlign: 'left',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 500,
      color: it.destructive ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))',
      transition: 'background var(--duration-fast) var(--ease-standard)'
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = it.destructive ? 'hsl(var(--destructive) / 0.1)' : 'hsl(var(--muted))';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'transparent';
    }
  }, it.icon, it.label))));
}
Object.assign(__ds_scope, { DropdownMenu });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ui/DropdownMenu.jsx", error: String((e && e.message) || e) }); }

// components/ui/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — campo de texto base. Altura 44px (alvo de toque), foco com anel duplo.
 * Suporta estado de erro e ícone/afixo à esquerda ou direita.
 */
function Input({
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
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: 44,
      padding: '0 12px',
      background: 'hsl(var(--card))',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-sm)',
      boxShadow: focused ? 'var(--focus-ring)' : 'var(--shadow-xs)',
      transition: 'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)'
    }
  }, leftAddon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'hsl(var(--muted-foreground))',
      display: 'inline-flex'
    }
  }, leftAddon), /*#__PURE__*/React.createElement("input", _extends({
    inputMode: inputMode,
    onFocus: e => {
      setFocused(true);
      if (selectOnFocus) e.target.select();
      onFocus && onFocus(e);
    },
    onBlur: () => setFocused(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: 16,
      color: 'hsl(var(--foreground))',
      height: '100%',
      ...style
    }
  }, rest)), rightAddon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'hsl(var(--muted-foreground))',
      display: 'inline-flex'
    }
  }, rightAddon));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ui/Input.jsx", error: String((e && e.message) || e) }); }

// components/ui/CurrencyInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * CurrencyInput — entrada monetária BRL. Acumulador de centavos: o usuário
 * digita dígitos e o valor é formatado como R$ 0,00 da direita para a esquerda.
 * Emite onValueChange(cents:number). inputMode numérico.
 */
function CurrencyInput({
  value,
  defaultValue = 0,
  onValueChange,
  error = false,
  ...rest
}) {
  const [cents, setCents] = React.useState(value != null ? value : defaultValue);
  const current = value != null ? value : cents;
  function format(c) {
    const n = (c / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return n;
  }
  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, '');
    const next = digits === '' ? 0 : parseInt(digits, 10);
    if (value == null) setCents(next);
    onValueChange && onValueChange(next);
  }
  return /*#__PURE__*/React.createElement(__ds_scope.Input, _extends({
    error: error,
    inputMode: "numeric",
    leftAddon: /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600,
        fontSize: 15
      }
    }, "R$"),
    value: format(current),
    onChange: handleChange,
    style: {
      textAlign: 'right',
      fontVariantNumeric: 'tabular-nums'
    }
  }, rest));
}
Object.assign(__ds_scope, { CurrencyInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ui/CurrencyInput.jsx", error: String((e && e.message) || e) }); }

// components/ui/Label.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Label — rótulo de campo. leading-none evita desalinhamento em grades. */
function Label({
  children,
  htmlFor,
  required = false,
  optional = false,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", _extends({
    htmlFor: htmlFor,
    style: {
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: 4,
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 600,
      lineHeight: 'var(--leading-none)',
      color: 'hsl(var(--foreground))',
      ...style
    }
  }, rest), children, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'hsl(var(--destructive))',
      lineHeight: 'var(--leading-none)'
    },
    "aria-hidden": "true"
  }, "*"), optional && !required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'hsl(var(--muted-foreground))',
      fontWeight: 400,
      fontSize: 13
    }
  }, "(opcional)"));
}
Object.assign(__ds_scope, { Label });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ui/Label.jsx", error: String((e && e.message) || e) }); }

// components/shared/Field.jsx
try { (() => {
/**
 * Field — envelope de campo: rótulo (com * / (opcional)) + controle + hint + erro.
 * Altura de linha do rótulo controlada para alinhar em grades multi-coluna.
 */
function Field({
  label,
  htmlFor,
  required = false,
  optional = false,
  hint,
  error,
  children,
  style = {}
}) {
  const id = htmlFor || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: 20,
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Label, {
    htmlFor: id,
    required: required,
    optional: optional
  }, label)), React.isValidElement(children) ? React.cloneElement(children, {
    id,
    error: !!error
  }) : children, error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      color: 'hsl(var(--destructive))'
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      color: 'hsl(var(--muted-foreground))'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shared/Field.jsx", error: String((e && e.message) || e) }); }

// components/ui/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Select — seleção nativa estilizada (acessível, teclado/leitor de tela).
 * Options: [{ value, label }] ou children <option>.
 */
function Select({
  error = false,
  options = null,
  placeholder,
  style = {},
  onFocus,
  children,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? 'hsl(var(--destructive))' : focused ? 'hsl(var(--ring))' : 'hsl(var(--input))';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    onFocus: e => {
      setFocused(true);
      onFocus && onFocus(e);
    },
    onBlur: () => setFocused(false),
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: '100%',
      height: 44,
      padding: '0 40px 0 12px',
      background: 'hsl(var(--card))',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-sm)',
      boxShadow: focused ? 'var(--focus-ring)' : 'var(--shadow-xs)',
      fontFamily: 'var(--font-sans)',
      fontSize: 16,
      color: 'hsl(var(--foreground))',
      outline: 'none',
      cursor: 'pointer',
      transition: 'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
      ...style
    }
  }, rest), placeholder && /*#__PURE__*/React.createElement("option", {
    value: ""
  }, placeholder), options ? options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label)) : children), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      right: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color: 'hsl(var(--muted-foreground))',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  }))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ui/Select.jsx", error: String((e && e.message) || e) }); }

// components/ui/Separator.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Separator — divisória fina. orientation horizontal (padrão) ou vertical. */
function Separator({
  orientation = 'horizontal',
  style = {},
  ...rest
}) {
  const isV = orientation === 'vertical';
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "separator",
    "aria-orientation": orientation,
    style: {
      background: 'hsl(var(--border))',
      flexShrink: 0,
      width: isV ? 1 : '100%',
      height: isV ? '100%' : 1,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Separator });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ui/Separator.jsx", error: String((e && e.message) || e) }); }

// components/ui/Sheet.jsx
try { (() => {
/** Sheet — painel deslizante lateral (filtros, detalhes). side left|right. */
function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  width = 420
}) {
  if (!open) return null;
  const fromX = side === 'right' ? '100%' : '-100%';
  return /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      background: 'hsl(165 30% 8% / 0.42)',
      backdropFilter: 'blur(2px)',
      animation: 'sf-fade var(--duration-base) var(--ease-standard)'
    }
  }, /*#__PURE__*/React.createElement("style", null, `@keyframes sf-fade{from{opacity:0}to{opacity:1}}@keyframes sf-slide{from{transform:translateX(${fromX})}to{transform:none}}`), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      [side]: 0,
      width: '100%',
      maxWidth: width,
      display: 'flex',
      flexDirection: 'column',
      background: 'hsl(var(--card))',
      boxShadow: 'var(--shadow-lg)',
      borderLeft: side === 'right' ? '1px solid hsl(var(--border))' : 'none',
      borderRight: side === 'left' ? '1px solid hsl(var(--border))' : 'none',
      animation: 'sf-slide var(--duration-base) var(--ease-standard)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      padding: '20px 22px',
      borderBottom: '1px solid hsl(var(--border))'
    }
  }, /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 18,
      fontWeight: 600,
      color: 'hsl(var(--foreground))'
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13.5,
      color: 'hsl(var(--muted-foreground))',
      marginTop: 4
    }
  }, description)), /*#__PURE__*/React.createElement("button", {
    "aria-label": "Fechar",
    onClick: onClose,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      height: 36,
      flexShrink: 0,
      border: 'none',
      background: 'transparent',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      color: 'hsl(var(--muted-foreground))'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 22,
      overflowY: 'auto',
      flex: 1,
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      color: 'hsl(var(--foreground))'
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      justifyContent: 'flex-end',
      padding: '14px 22px',
      borderTop: '1px solid hsl(var(--border))'
    }
  }, footer)));
}
Object.assign(__ds_scope, { Sheet });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ui/Sheet.jsx", error: String((e && e.message) || e) }); }

// components/ui/Skeleton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Skeleton — placeholder de carregamento com shimmer suave. */
function Skeleton({
  width = '100%',
  height = 16,
  radius = 'var(--radius-sm)',
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'block',
      width,
      height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--secondary)) 37%, hsl(var(--muted)) 63%)',
      backgroundSize: '400% 100%',
      animation: 'sf-shimmer 1.4s ease infinite',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("style", null, `@keyframes sf-shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }`));
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ui/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/ui/StatusBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * StatusBadge — badge semântico para status de negócio do ERP.
 * Mapeia status conhecidos para cor + rótulo pt-BR e um ponto indicador.
 */
const STATUS = {
  pago: {
    label: 'Pago',
    color: 'var(--success)'
  },
  recebido: {
    label: 'Recebido',
    color: 'var(--success)'
  },
  pendente: {
    label: 'Pendente',
    color: 'var(--warning)'
  },
  atrasado: {
    label: 'Atrasado',
    color: 'var(--destructive)'
  },
  vencido: {
    label: 'Vencido',
    color: 'var(--destructive)'
  },
  rascunho: {
    label: 'Rascunho',
    color: 'var(--muted-foreground)'
  },
  aprovado: {
    label: 'Aprovado',
    color: 'var(--primary)'
  },
  cancelado: {
    label: 'Cancelado',
    color: 'var(--muted-foreground)'
  },
  em_andamento: {
    label: 'Em andamento',
    color: 'var(--chart-3)'
  }
};
function StatusBadge({
  status,
  label,
  style = {},
  ...rest
}) {
  const cfg = STATUS[status] || {
    label: label || status,
    color: 'var(--muted-foreground)'
  };
  const text = label || cfg.label;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 24,
      padding: '0 10px',
      borderRadius: 'var(--radius-full)',
      background: `hsl(${cfg.color} / 0.12)`,
      color: `hsl(${cfg.color})`,
      fontFamily: 'var(--font-sans)',
      fontSize: 12.5,
      fontWeight: 600,
      lineHeight: 1,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: `hsl(${cfg.color})`
    }
  }), text);
}
Object.assign(__ds_scope, { StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ui/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/ui/Table.jsx
try { (() => {
/**
 * Table — tabela densa e responsiva. columns: [{ key, header, align, hideBelow, render, tabular }].
 * hideBelow ('sm'|'md'|'lg') esconde colunas secundárias no mobile, mantendo o essencial.
 */
function Table({
  columns = [],
  data = [],
  rowKey = 'id',
  onRowClick,
  empty = null,
  style = {}
}) {
  const hideClass = {
    sm: 'sf-hide-sm',
    md: 'sf-hide-md',
    lg: 'sf-hide-lg'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      overflowX: 'auto',
      ...style
    }
  }, /*#__PURE__*/React.createElement("style", null, `
        @media (max-width: 640px){ .sf-hide-sm{display:none!important} }
        @media (max-width: 768px){ .sf-hide-md{display:none!important} }
        @media (max-width: 1024px){ .sf-hide-lg{display:none!important} }
      `), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontFamily: 'var(--font-sans)',
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    className: c.hideBelow ? hideClass[c.hideBelow] : '',
    style: {
      textAlign: c.align || 'left',
      padding: '10px 14px',
      color: 'hsl(var(--muted-foreground))',
      fontWeight: 600,
      fontSize: 12.5,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      borderBottom: '1px solid hsl(var(--border))',
      whiteSpace: 'nowrap'
    }
  }, c.header)))), /*#__PURE__*/React.createElement("tbody", null, data.length === 0 && empty && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: columns.length,
    style: {
      padding: 0
    }
  }, empty)), data.map((row, i) => /*#__PURE__*/React.createElement("tr", {
    key: row[rowKey] ?? i,
    onClick: onRowClick ? () => onRowClick(row) : undefined,
    style: {
      cursor: onRowClick ? 'pointer' : 'default',
      transition: 'background var(--duration-fast) var(--ease-standard)'
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = 'hsl(var(--muted))';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'transparent';
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    className: c.hideBelow ? hideClass[c.hideBelow] : '',
    style: {
      textAlign: c.align || 'left',
      padding: '12px 14px',
      borderBottom: '1px solid hsl(var(--border))',
      color: 'hsl(var(--foreground))',
      fontVariantNumeric: c.tabular ? 'tabular-nums' : 'normal',
      whiteSpace: 'nowrap'
    }
  }, c.render ? c.render(row) : row[c.key])))))));
}
Object.assign(__ds_scope, { Table });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ui/Table.jsx", error: String((e && e.message) || e) }); }

// components/ui/Tabs.jsx
try { (() => {
/**
 * Tabs — navegação por abas. items: [{ value, label, icon? }].
 * Controlado (value + onValueChange) ou não-controlado (defaultValue).
 */
function Tabs({
  items = [],
  value,
  defaultValue,
  onValueChange,
  style = {}
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? (items[0] && items[0].value));
  const active = value != null ? value : internal;
  function select(v) {
    if (value == null) setInternal(v);
    onValueChange && onValueChange(v);
  }
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'inline-flex',
      gap: 2,
      padding: 4,
      background: 'hsl(var(--muted))',
      borderRadius: 'var(--radius-md)',
      ...style
    }
  }, items.map(it => {
    const on = it.value === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      role: "tab",
      "aria-selected": on,
      onClick: () => select(it.value),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        height: 36,
        padding: '0 14px',
        border: 'none',
        cursor: 'pointer',
        borderRadius: 'var(--radius-sm)',
        background: on ? 'hsl(var(--card))' : 'transparent',
        color: on ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
        boxShadow: on ? 'var(--shadow-xs)' : 'none',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        fontWeight: 600,
        transition: 'background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)'
      }
    }, it.icon, it.label);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ui/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/ui/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Textarea — texto de múltiplas linhas (observações, descrições). */
function Textarea({
  error = false,
  rows = 4,
  style = {},
  onFocus,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? 'hsl(var(--destructive))' : focused ? 'hsl(var(--ring))' : 'hsl(var(--input))';
  return /*#__PURE__*/React.createElement("textarea", _extends({
    rows: rows,
    onFocus: e => {
      setFocused(true);
      onFocus && onFocus(e);
    },
    onBlur: () => setFocused(false),
    style: {
      width: '100%',
      padding: '10px 12px',
      background: 'hsl(var(--card))',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-sm)',
      boxShadow: focused ? 'var(--focus-ring)' : 'var(--shadow-xs)',
      fontFamily: 'var(--font-sans)',
      fontSize: 16,
      lineHeight: 'var(--leading-normal)',
      color: 'hsl(var(--foreground))',
      outline: 'none',
      resize: 'vertical',
      transition: 'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ui/Textarea.jsx", error: String((e && e.message) || e) }); }

// ui_kits/erp/FinanceiroScreen.jsx
try { (() => {
/* __IIFE__ */
(function () {
  const Icon = window.Icon;
  function FinanceiroScreen() {
    const NS = window.SistemaFloresDesignSystem_d212f4;
    const {
      PageHeader,
      Button,
      Card,
      CardHeader,
      CardBody,
      Tabs,
      Table,
      StatusBadge
    } = NS;
    const [aba, setAba] = React.useState('receber');
    const receber = [{
      id: 1,
      cliente: 'Buffê Jardim',
      venc: '04/07/2026',
      valor: 'R$ 2.400,00',
      status: 'pendente'
    }, {
      id: 2,
      cliente: 'Casamento Ana & João',
      venc: '06/07/2026',
      valor: 'R$ 5.180,00',
      status: 'aprovado'
    }, {
      id: 3,
      cliente: 'Verde SA',
      venc: '30/06/2026',
      valor: 'R$ 1.320,00',
      status: 'atrasado'
    }, {
      id: 4,
      cliente: 'Maria Silva',
      venc: '10/07/2026',
      valor: 'R$ 780,00',
      status: 'pago'
    }];
    const pagar = [{
      id: 1,
      cliente: 'Atacado Flores Sul',
      venc: '05/07/2026',
      valor: 'R$ 1.980,00',
      status: 'pendente'
    }, {
      id: 2,
      cliente: 'Embalagens Lima',
      venc: '02/07/2026',
      valor: 'R$ 460,00',
      status: 'atrasado'
    }, {
      id: 3,
      cliente: 'Transporte Veloz',
      venc: '11/07/2026',
      valor: 'R$ 320,00',
      status: 'pago'
    }];
    const dados = aba === 'pagar' ? pagar : receber;
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PageHeader, {
      title: "Financeiro",
      description: "A receber, a pagar, caixa e DRE em um s\xF3 lugar.",
      actions: /*#__PURE__*/React.createElement(Button, {
        variant: "outline",
        leftIcon: /*#__PURE__*/React.createElement(Icon.Mais, {
          size: 18
        })
      }, "Novo lan\xE7amento")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: 16
      }
    }, [{
      l: 'Saldo em caixa',
      v: 'R$ 3.240,00',
      c: 'var(--primary)'
    }, {
      l: 'A receber',
      v: 'R$ 18.420,00',
      c: 'var(--success)'
    }, {
      l: 'A pagar',
      v: 'R$ 7.960,00',
      c: 'var(--destructive)'
    }].map(s => /*#__PURE__*/React.createElement(Card, {
      key: s.l
    }, /*#__PURE__*/React.createElement(CardBody, {
      style: {
        padding: 20
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: 'hsl(var(--muted-foreground))'
      }
    }, s.l), /*#__PURE__*/React.createElement("div", {
      className: "tabular-nums",
      style: {
        fontSize: 26,
        fontWeight: 700,
        color: `hsl(${s.c})`,
        fontVariantNumeric: 'tabular-nums',
        marginTop: 6,
        letterSpacing: '-0.01em'
      }
    }, s.v))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "Lan\xE7amentos",
      action: /*#__PURE__*/React.createElement(Tabs, {
        value: aba,
        onValueChange: setAba,
        items: [{
          value: 'receber',
          label: 'A receber'
        }, {
          value: 'pagar',
          label: 'A pagar'
        }, {
          value: 'caixa',
          label: 'Caixa'
        }]
      })
    }), /*#__PURE__*/React.createElement(CardBody, {
      style: {
        padding: '4px 8px 8px'
      }
    }, aba === 'caixa' ? /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '24px 12px'
      }
    }, [{
      d: 'Recebimento — Maria Silva',
      v: '+ R$ 780,00',
      up: true
    }, {
      d: 'Compra — Atacado Flores Sul',
      v: '− R$ 1.980,00',
      up: false
    }, {
      d: 'Recebimento — Buffê Jardim',
      v: '+ R$ 1.200,00',
      up: true
    }].map((r, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderTop: i ? '1px solid hsl(var(--border))' : 'none'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14.5,
        color: 'hsl(var(--foreground))'
      }
    }, r.d), /*#__PURE__*/React.createElement("span", {
      className: "tabular-nums",
      style: {
        fontSize: 15,
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        color: r.up ? 'hsl(var(--success))' : 'hsl(var(--destructive))'
      }
    }, r.v)))) : /*#__PURE__*/React.createElement(Table, {
      columns: [{
        key: 'cliente',
        header: aba === 'pagar' ? 'Fornecedor' : 'Cliente'
      }, {
        key: 'venc',
        header: 'Vencimento',
        hideBelow: 'sm'
      }, {
        key: 'valor',
        header: 'Valor',
        align: 'right',
        tabular: true
      }, {
        key: 'status',
        header: 'Status',
        render: r => /*#__PURE__*/React.createElement(StatusBadge, {
          status: r.status
        })
      }, {
        key: 'acao',
        header: '',
        align: 'right',
        render: r => r.status === 'pago' ? /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 13,
            color: 'hsl(var(--muted-foreground))'
          }
        }, "Quitado") : /*#__PURE__*/React.createElement(Button, {
          size: "sm",
          variant: "outline"
        }, "Baixar")
      }],
      data: dados
    }))));
  }
  window.FinanceiroScreen = FinanceiroScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/erp/FinanceiroScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/erp/Icons.jsx
try { (() => {
// Ícones lucide (traço 1.75, currentColor) — subconjunto usado no kit ERP.
// Mesmo sistema do produto (lucide-react). Não desenhar ícones próprios.
/* __IIFE__ */
(function () {
  function Svg({
    children,
    size = 20,
    stroke = 1.75,
    style
  }) {
    return /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: stroke,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: style,
      "aria-hidden": "true"
    }, children);
  }
  const Icon = {
    Painel: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
      width: "7",
      height: "9",
      x: "3",
      y: "3",
      rx: "1"
    }), /*#__PURE__*/React.createElement("rect", {
      width: "7",
      height: "5",
      x: "14",
      y: "3",
      rx: "1"
    }), /*#__PURE__*/React.createElement("rect", {
      width: "7",
      height: "9",
      x: "14",
      y: "12",
      rx: "1"
    }), /*#__PURE__*/React.createElement("rect", {
      width: "7",
      height: "5",
      x: "3",
      y: "16",
      rx: "1"
    })),
    Clientes: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
      d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "9",
      cy: "7",
      r: "4"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M22 21v-2a4 4 0 0 0-3-3.87"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M16 3.13a4 4 0 0 1 0 7.75"
    })),
    Orcamento: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
      d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M14 2v6h6"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M9 13h6"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M9 17h4"
    })),
    Estoque: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
      d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m3.3 7 8.7 5 8.7-5"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 22V12"
    })),
    Compras: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
      cx: "8",
      cy: "21",
      r: "1"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "19",
      cy: "21",
      r: "1"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
    })),
    Financeiro: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
      d: "M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M2 10h20"
    })),
    Relatorios: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
      d: "M3 3v16a2 2 0 0 0 2 2h16"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M18 17V9"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M13 17V5"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M8 17v-3"
    })),
    Busca: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
      cx: "11",
      cy: "11",
      r: "8"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m21 21-4.3-4.3"
    })),
    Mais: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
      d: "M5 12h14"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 5v14"
    })),
    Sino: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
      d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10.3 21a1.94 1.94 0 0 0 3.4 0"
    })),
    Reticencias: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "1"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "19",
      cy: "12",
      r: "1"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "5",
      cy: "12",
      r: "1"
    })),
    Seta: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
      d: "m9 18 6-6-6-6"
    })),
    Sobe: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
      d: "M7 17 17 7"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M7 7h10v10"
    })),
    Desce: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
      d: "M7 7 17 17"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M17 7v10H7"
    })),
    Calendario: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
      d: "M8 2v4"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M16 2v4"
    }), /*#__PURE__*/React.createElement("rect", {
      width: "18",
      height: "18",
      x: "3",
      y: "4",
      rx: "2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M3 10h18"
    })),
    Flor: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "3"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 7.5V9"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m7.5 12 1.5.5"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 16.5V15"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m16.5 12-1.5-.5"
    }))
  };
  window.Icon = Icon;
  window.Svg = Svg;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/erp/Icons.jsx", error: String((e && e.message) || e) }); }

// ui_kits/erp/OrcamentosScreen.jsx
try { (() => {
/* __IIFE__ */
(function () {
  const Icon = window.Icon;
  function OrcamentosScreen({
    onNew
  }) {
    const NS = window.SistemaFloresDesignSystem_d212f4;
    const {
      PageHeader,
      Button,
      Card,
      CardBody,
      Table,
      StatusBadge,
      DropdownMenu,
      EmptyState
    } = NS;
    const dados = [{
      id: 1,
      cliente: 'Casamento Ana & João',
      evento: 'Casamento',
      data: '06/07/2026',
      valor: 'R$ 5.180,00',
      status: 'aprovado'
    }, {
      id: 2,
      cliente: 'Buffê Jardim',
      evento: 'Corporativo',
      data: '12/07/2026',
      valor: 'R$ 2.400,00',
      status: 'pendente'
    }, {
      id: 3,
      cliente: 'Verde SA',
      evento: 'Inauguração',
      data: '18/07/2026',
      valor: 'R$ 1.320,00',
      status: 'rascunho'
    }, {
      id: 4,
      cliente: 'Aniversário 50 anos',
      evento: 'Festa',
      data: '06/07/2026',
      valor: 'R$ 3.900,00',
      status: 'aprovado'
    }];
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PageHeader, {
      title: "Or\xE7amentos",
      description: "Crie e acompanhe propostas de eventos.",
      actions: /*#__PURE__*/React.createElement(Button, {
        leftIcon: /*#__PURE__*/React.createElement(Icon.Mais, {
          size: 18
        }),
        onClick: onNew
      }, "Novo or\xE7amento")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: 16
      }
    }, [{
      l: 'Abertos',
      v: '9',
      c: 'var(--primary)'
    }, {
      l: 'Aprovados no mês',
      v: '14',
      c: 'var(--success)'
    }, {
      l: 'Valor em negociação',
      v: 'R$ 22.400',
      c: 'var(--clay)'
    }].map(s => /*#__PURE__*/React.createElement(Card, {
      key: s.l
    }, /*#__PURE__*/React.createElement(CardBody, {
      style: {
        padding: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 4,
        height: 40,
        borderRadius: 4,
        background: `hsl(${s.c})`
      }
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: 'hsl(var(--muted-foreground))'
      }
    }, s.l), /*#__PURE__*/React.createElement("div", {
      className: "tabular-nums",
      style: {
        fontSize: 22,
        fontWeight: 700,
        color: 'hsl(var(--foreground))',
        fontVariantNumeric: 'tabular-nums'
      }
    }, s.v)))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardBody, {
      style: {
        padding: '4px 8px 8px'
      }
    }, /*#__PURE__*/React.createElement(Table, {
      columns: [{
        key: 'cliente',
        header: 'Cliente'
      }, {
        key: 'evento',
        header: 'Evento',
        hideBelow: 'md'
      }, {
        key: 'data',
        header: 'Data',
        hideBelow: 'sm'
      }, {
        key: 'valor',
        header: 'Valor',
        align: 'right',
        tabular: true
      }, {
        key: 'status',
        header: 'Status',
        render: r => /*#__PURE__*/React.createElement(StatusBadge, {
          status: r.status
        })
      }, {
        key: 'acoes',
        header: '',
        align: 'right',
        render: () => /*#__PURE__*/React.createElement(DropdownMenu, {
          trigger: /*#__PURE__*/React.createElement("span", {
            style: {
              display: 'inline-flex',
              padding: 6,
              borderRadius: 8,
              color: 'hsl(var(--muted-foreground))',
              cursor: 'pointer'
            }
          }, /*#__PURE__*/React.createElement(Icon.Reticencias, {
            size: 18
          })),
          items: [{
            label: 'Ver detalhes'
          }, {
            label: 'Duplicar'
          }, {
            separator: true
          }, {
            label: 'Excluir',
            destructive: true
          }]
        })
      }],
      data: dados
    }))));
  }
  window.OrcamentosScreen = OrcamentosScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/erp/OrcamentosScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/erp/PainelScreen.jsx
try { (() => {
/* __IIFE__ */
(function () {
  const Icon = window.Icon;
  function PainelScreen() {
    const NS = window.SistemaFloresDesignSystem_d212f4;
    const {
      PageHeader,
      Button,
      Card,
      CardHeader,
      CardBody,
      Table,
      StatusBadge
    } = NS;
    const kpis = [{
      label: 'A receber (mês)',
      value: 'R$ 18.420,00',
      delta: '+12%',
      up: true
    }, {
      label: 'A pagar (mês)',
      value: 'R$ 7.960,00',
      delta: '−4%',
      up: false
    }, {
      label: 'Caixa hoje',
      value: 'R$ 3.240,00',
      delta: '+R$ 640',
      up: true
    }, {
      label: 'Eventos na semana',
      value: '6',
      delta: '2 hoje',
      up: true
    }];
    const barras = [{
      m: 'Jan',
      v: 62
    }, {
      m: 'Fev',
      v: 48
    }, {
      m: 'Mar',
      v: 71
    }, {
      m: 'Abr',
      v: 55
    }, {
      m: 'Mai',
      v: 83
    }, {
      m: 'Jun',
      v: 92
    }];
    const max = 100;
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PageHeader, {
      eyebrow: "Junho de 2026",
      title: "Bom dia, L\xFAcia",
      description: "Um resumo do seu ateli\xEA hoje.",
      actions: /*#__PURE__*/React.createElement(Button, {
        leftIcon: /*#__PURE__*/React.createElement(Icon.Mais, {
          size: 18
        })
      }, "Novo or\xE7amento")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16
      }
    }, kpis.map(k => /*#__PURE__*/React.createElement(Card, {
      key: k.label
    }, /*#__PURE__*/React.createElement(CardBody, {
      style: {
        padding: 20
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: 'hsl(var(--muted-foreground))'
      }
    }, k.label), /*#__PURE__*/React.createElement("div", {
      className: "tabular-nums",
      style: {
        fontFamily: 'var(--font-sans)',
        fontVariantNumeric: 'tabular-nums',
        fontSize: 27,
        fontWeight: 700,
        color: 'hsl(var(--foreground))',
        marginTop: 8,
        letterSpacing: '-0.01em'
      }
    }, k.value), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        marginTop: 8,
        fontSize: 13,
        fontWeight: 600,
        color: k.up ? 'hsl(var(--success))' : 'hsl(var(--destructive))'
      }
    }, k.up ? /*#__PURE__*/React.createElement(Icon.Sobe, {
      size: 15
    }) : /*#__PURE__*/React.createElement(Icon.Desce, {
      size: 15
    }), k.delta))))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: 16,
        marginTop: 16
      }
    }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "Faturamento por m\xEAs",
      description: "\xDAltimos 6 meses"
    }), /*#__PURE__*/React.createElement(CardBody, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: 18,
        height: 180,
        padding: '8px 4px 0'
      }
    }, barras.map((b, i) => /*#__PURE__*/React.createElement("div", {
      key: b.m,
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        height: '100%',
        justifyContent: 'flex-end'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        maxWidth: 44,
        height: `${b.v / max * 100}%`,
        borderRadius: '8px 8px 4px 4px',
        background: i === barras.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.28)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'hsl(var(--muted-foreground))',
        fontWeight: 500
      }
    }, b.m)))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "Pr\xF3ximos eventos",
      description: "Esta semana"
    }), /*#__PURE__*/React.createElement(CardBody, {
      style: {
        paddingTop: 8
      }
    }, [{
      nome: 'Casamento Ana & João',
      data: '05/07',
      tag: 'em_andamento'
    }, {
      nome: 'Aniversário 50 anos',
      data: '06/07',
      tag: 'aprovado'
    }, {
      nome: 'Corporativo Verde SA',
      data: '08/07',
      tag: 'rascunho'
    }].map((e, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderTop: i ? '1px solid hsl(var(--border))' : 'none'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-md)',
        background: 'hsl(var(--accent))',
        color: 'hsl(var(--clay))',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Icon.Calendario, {
      size: 20
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14.5,
        fontWeight: 600,
        color: 'hsl(var(--foreground))'
      }
    }, e.nome), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'hsl(var(--muted-foreground))'
      }
    }, e.data)), /*#__PURE__*/React.createElement(StatusBadge, {
      status: e.tag
    })))))), /*#__PURE__*/React.createElement(Card, {
      style: {
        marginTop: 16
      }
    }, /*#__PURE__*/React.createElement(CardHeader, {
      title: "Contas a receber",
      description: "Vencimentos pr\xF3ximos",
      action: /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        size: "sm",
        rightIcon: /*#__PURE__*/React.createElement(Icon.Seta, {
          size: 16
        })
      }, "Ver todas")
    }), /*#__PURE__*/React.createElement(CardBody, {
      style: {
        padding: '4px 8px 8px'
      }
    }, /*#__PURE__*/React.createElement(Table, {
      columns: [{
        key: 'cliente',
        header: 'Cliente'
      }, {
        key: 'doc',
        header: 'Documento',
        hideBelow: 'md'
      }, {
        key: 'venc',
        header: 'Vencimento',
        hideBelow: 'sm'
      }, {
        key: 'valor',
        header: 'Valor',
        align: 'right',
        tabular: true
      }, {
        key: 'status',
        header: 'Status',
        render: r => /*#__PURE__*/React.createElement(StatusBadge, {
          status: r.status
        })
      }],
      data: [{
        id: 1,
        cliente: 'Buffê Jardim',
        doc: 'OS-1042',
        venc: '04/07/2026',
        valor: 'R$ 2.400,00',
        status: 'pendente'
      }, {
        id: 2,
        cliente: 'Casamento Ana & João',
        doc: 'OS-1043',
        venc: '06/07/2026',
        valor: 'R$ 5.180,00',
        status: 'aprovado'
      }, {
        id: 3,
        cliente: 'Verde SA',
        doc: 'OS-1039',
        venc: '30/06/2026',
        valor: 'R$ 1.320,00',
        status: 'atrasado'
      }, {
        id: 4,
        cliente: 'Maria Silva',
        doc: 'OS-1044',
        venc: '10/07/2026',
        valor: 'R$ 780,00',
        status: 'pago'
      }]
    }))));
  }
  window.PainelScreen = PainelScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/erp/PainelScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/erp/Sidebar.jsx
try { (() => {
/* __IIFE__ */
(function () {
  const Icon = window.Icon;
  const GROUPS = [{
    label: 'Dia a dia',
    items: [{
      id: 'painel',
      label: 'Painel',
      icon: Icon.Painel
    }, {
      id: 'clientes',
      label: 'Clientes',
      icon: Icon.Clientes
    }, {
      id: 'orcamentos',
      label: 'Orçamentos',
      icon: Icon.Orcamento
    }]
  }, {
    label: 'Suprimentos',
    items: [{
      id: 'estoque',
      label: 'Estoque',
      icon: Icon.Estoque
    }, {
      id: 'compras',
      label: 'Compras',
      icon: Icon.Compras
    }]
  }, {
    label: 'Gestão',
    items: [{
      id: 'financeiro',
      label: 'Financeiro',
      icon: Icon.Financeiro
    }, {
      id: 'relatorios',
      label: 'Relatórios',
      icon: Icon.Relatorios
    }]
  }];
  function Sidebar({
    active,
    onNavigate
  }) {
    return /*#__PURE__*/React.createElement("aside", {
      style: {
        width: 256,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'hsl(var(--card))',
        borderRight: '1px solid hsl(var(--border))'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        height: 64,
        padding: '0 20px',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        color: 'hsl(var(--primary))'
      }
    }, /*#__PURE__*/React.createElement(Icon.Flor, {
      size: 26
    })), /*#__PURE__*/React.createElement("span", {
      className: "font-serif",
      style: {
        fontFamily: 'var(--font-serif)',
        fontVariationSettings: "'SOFT' 40",
        fontSize: 21,
        fontWeight: 600,
        color: 'hsl(var(--foreground))',
        letterSpacing: '-0.01em'
      }
    }, "Sistema Flores")), /*#__PURE__*/React.createElement("nav", {
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: '8px 12px 20px'
      }
    }, GROUPS.map(g => /*#__PURE__*/React.createElement("div", {
      key: g.label,
      style: {
        marginTop: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'hsl(var(--muted-foreground))',
        padding: '0 10px 6px'
      }
    }, g.label), g.items.map(it => {
      const on = active === it.id;
      const I = it.icon;
      return /*#__PURE__*/React.createElement("button", {
        key: it.id,
        onClick: () => onNavigate(it.id),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          width: '100%',
          height: 44,
          padding: '0 10px',
          marginBottom: 2,
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          textAlign: 'left',
          background: on ? 'hsl(var(--secondary))' : 'transparent',
          color: on ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
          fontFamily: 'var(--font-sans)',
          fontSize: 15,
          fontWeight: on ? 600 : 500,
          transition: 'background var(--duration-fast) var(--ease-standard)'
        },
        onMouseEnter: e => {
          if (!on) e.currentTarget.style.background = 'hsl(var(--muted))';
        },
        onMouseLeave: e => {
          if (!on) e.currentTarget.style.background = 'transparent';
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'inline-flex',
          color: on ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
        }
      }, /*#__PURE__*/React.createElement(I, {
        size: 20
      })), it.label);
    })))));
  }
  window.Sidebar = Sidebar;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/erp/Sidebar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/erp/Topbar.jsx
try { (() => {
/* __IIFE__ */
(function () {
  const Icon = window.Icon;
  function Topbar({
    onSearch
  }) {
    const NS = window.SistemaFloresDesignSystem_d212f4;
    const {
      Avatar
    } = NS;
    return /*#__PURE__*/React.createElement("header", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        height: 64,
        flexShrink: 0,
        padding: '0 24px',
        background: 'hsl(var(--card))',
        borderBottom: '1px solid hsl(var(--border))'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: onSearch,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        height: 40,
        width: 320,
        maxWidth: '40vw',
        padding: '0 12px',
        background: 'hsl(var(--muted))',
        border: '1px solid transparent',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        color: 'hsl(var(--muted-foreground))',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        textAlign: 'left'
      }
    }, /*#__PURE__*/React.createElement(Icon.Busca, {
      size: 18
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, "Buscar cliente, or\xE7amento\u2026"), /*#__PURE__*/React.createElement("kbd", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        fontWeight: 600,
        padding: '2px 6px',
        background: 'hsl(var(--card))',
        borderRadius: 6,
        border: '1px solid hsl(var(--border))'
      }
    }, "\u2318K")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement("button", {
      "aria-label": "Notifica\xE7\xF5es",
      style: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        border: 'none',
        background: 'transparent',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        color: 'hsl(var(--muted-foreground))'
      }
    }, /*#__PURE__*/React.createElement(Icon.Sino, {
      size: 21
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: 10,
        right: 11,
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: 'hsl(var(--clay))',
        border: '2px solid hsl(var(--card))'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "L\xFAcia Prado",
      size: 38
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        lineHeight: 1.2
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        fontWeight: 600,
        color: 'hsl(var(--foreground))'
      }
    }, "L\xFAcia Prado"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        color: 'hsl(var(--muted-foreground))'
      }
    }, "Floricultura Bela Flor"))));
  }
  window.Topbar = Topbar;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/erp/Topbar.jsx", error: String((e && e.message) || e) }); }

__ds_ns.ConfirmDialog = __ds_scope.ConfirmDialog;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.PageHeader = __ds_scope.PageHeader;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardHeader = __ds_scope.CardHeader;

__ds_ns.CardBody = __ds_scope.CardBody;

__ds_ns.CardFooter = __ds_scope.CardFooter;

__ds_ns.CurrencyInput = __ds_scope.CurrencyInput;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.DropdownMenu = __ds_scope.DropdownMenu;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Label = __ds_scope.Label;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Separator = __ds_scope.Separator;

__ds_ns.Sheet = __ds_scope.Sheet;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.Table = __ds_scope.Table;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Textarea = __ds_scope.Textarea;

})();
