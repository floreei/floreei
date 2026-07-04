import React from 'react';

/**
 * DropdownMenu — menu de ações ancorado a um gatilho.
 * items: [{ label, icon?, onClick, destructive?, separator? }].
 */
export function DropdownMenu({ trigger, items = [], align = 'end' }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <span onClick={() => setOpen((o) => !o)} style={{ display: 'inline-flex' }}>{trigger}</span>
      {open && (
        <div role="menu" style={{
          position: 'absolute', top: 'calc(100% + 6px)', [align === 'end' ? 'right' : 'left']: 0, zIndex: 40,
          minWidth: 200, padding: 6, background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
          animation: 'sf-pop var(--duration-fast) var(--ease-standard)',
        }}>
          <style>{`@keyframes sf-pop{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}`}</style>
          {items.map((it, i) => it.separator ? (
            <div key={i} style={{ height: 1, background: 'hsl(var(--border))', margin: '6px 0' }} />
          ) : (
            <button key={i} role="menuitem" onClick={() => { setOpen(false); it.onClick && it.onClick(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', height: 40, padding: '0 10px',
                border: 'none', background: 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
                color: it.destructive ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))',
                transition: 'background var(--duration-fast) var(--ease-standard)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = it.destructive ? 'hsl(var(--destructive) / 0.1)' : 'hsl(var(--muted))'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              {it.icon}{it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
