/* __IIFE__ */
(function(){
const Icon = window.Icon;

const GROUPS = [
  { label: 'Dia a dia', items: [
    { id: 'painel', label: 'Painel', icon: Icon.Painel },
    { id: 'clientes', label: 'Clientes', icon: Icon.Clientes },
    { id: 'orcamentos', label: 'Orçamentos', icon: Icon.Orcamento },
  ]},
  { label: 'Suprimentos', items: [
    { id: 'estoque', label: 'Estoque', icon: Icon.Estoque },
    { id: 'compras', label: 'Compras', icon: Icon.Compras },
  ]},
  { label: 'Gestão', items: [
    { id: 'financeiro', label: 'Financeiro', icon: Icon.Financeiro },
    { id: 'relatorios', label: 'Relatórios', icon: Icon.Relatorios },
  ]},
];

function Sidebar({ active, onNavigate }) {
  return (
    <aside style={{ width: 256, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column',
      background: 'hsl(var(--card))', borderRight: '1px solid hsl(var(--border))' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 64, padding: '0 20px', flexShrink: 0 }}>
        <span style={{ display: 'inline-flex', color: 'hsl(var(--primary))' }}><Icon.Flor size={26} /></span>
        <span className="font-serif" style={{ fontFamily: 'var(--font-serif)', fontVariationSettings: "'SOFT' 40", fontSize: 21, fontWeight: 600, color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}>Sistema Flores</span>
      </div>
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 20px' }}>
        {GROUPS.map((g) => (
          <div key={g.label} style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'hsl(var(--muted-foreground))', padding: '0 10px 6px' }}>{g.label}</div>
            {g.items.map((it) => {
              const on = active === it.id;
              const I = it.icon;
              return (
                <button key={it.id} onClick={() => onNavigate(it.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', height: 44, padding: '0 10px',
                    marginBottom: 2, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
                    background: on ? 'hsl(var(--secondary))' : 'transparent',
                    color: on ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                    fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: on ? 600 : 500,
                    transition: 'background var(--duration-fast) var(--ease-standard)' }}
                  onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'hsl(var(--muted))'; }}
                  onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ display: 'inline-flex', color: on ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}><I size={20} /></span>
                  {it.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

window.Sidebar = Sidebar;
})();
