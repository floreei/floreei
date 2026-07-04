/* __IIFE__ */
(function(){
const Icon = window.Icon;

function Topbar({ onSearch }) {
  const NS = window.SistemaFloresDesignSystem_d212f4;
  const { Avatar } = NS;
  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: 16, height: 64, flexShrink: 0,
      padding: '0 24px', background: 'hsl(var(--card))', borderBottom: '1px solid hsl(var(--border))' }}>
      <button onClick={onSearch}
        style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40, width: 320, maxWidth: '40vw', padding: '0 12px',
          background: 'hsl(var(--muted))', border: '1px solid transparent', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontSize: 14, textAlign: 'left' }}>
        <Icon.Busca size={18} />
        <span style={{ flex: 1 }}>Buscar cliente, orçamento…</span>
        <kbd style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, padding: '2px 6px',
          background: 'hsl(var(--card))', borderRadius: 6, border: '1px solid hsl(var(--border))' }}>⌘K</kbd>
      </button>
      <div style={{ flex: 1 }} />
      <button aria-label="Notificações" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 44, height: 44, border: 'none', background: 'transparent', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>
        <Icon.Sino size={21} />
        <span style={{ position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: '50%', background: 'hsl(var(--clay))', border: '2px solid hsl(var(--card))' }} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name="Lúcia Prado" size={38} />
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Lúcia Prado</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Floricultura Bela Flor</div>
        </div>
      </div>
    </header>
  );
}

window.Topbar = Topbar;
})();
