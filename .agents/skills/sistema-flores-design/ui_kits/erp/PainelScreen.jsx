/* __IIFE__ */
(function(){
const Icon = window.Icon;

function PainelScreen() {
  const NS = window.SistemaFloresDesignSystem_d212f4;
  const { PageHeader, Button, Card, CardHeader, CardBody, Table, StatusBadge } = NS;

  const kpis = [
    { label: 'A receber (mês)', value: 'R$ 18.420,00', delta: '+12%', up: true },
    { label: 'A pagar (mês)', value: 'R$ 7.960,00', delta: '−4%', up: false },
    { label: 'Caixa hoje', value: 'R$ 3.240,00', delta: '+R$ 640', up: true },
    { label: 'Eventos na semana', value: '6', delta: '2 hoje', up: true },
  ];

  const barras = [
    { m: 'Jan', v: 62 }, { m: 'Fev', v: 48 }, { m: 'Mar', v: 71 },
    { m: 'Abr', v: 55 }, { m: 'Mai', v: 83 }, { m: 'Jun', v: 92 },
  ];
  const max = 100;

  return (
    <div>
      <PageHeader
        eyebrow="Junho de 2026"
        title="Bom dia, Lúcia"
        description="Um resumo do seu ateliê hoje."
        actions={<Button leftIcon={<Icon.Mais size={18} />}>Novo orçamento</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardBody style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>{k.label}</div>
              <div className="tabular-nums" style={{ fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums', fontSize: 27, fontWeight: 700, color: 'hsl(var(--foreground))', marginTop: 8, letterSpacing: '-0.01em' }}>{k.value}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 13, fontWeight: 600,
                color: k.up ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}>
                {k.up ? <Icon.Sobe size={15} /> : <Icon.Desce size={15} />}{k.delta}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginTop: 16 }}>
        <Card>
          <CardHeader title="Faturamento por mês" description="Últimos 6 meses" />
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: 180, padding: '8px 4px 0' }}>
              {barras.map((b, i) => (
                <div key={b.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '100%', maxWidth: 44, height: `${(b.v / max) * 100}%`, borderRadius: '8px 8px 4px 4px',
                    background: i === barras.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.28)' }} />
                  <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>{b.m}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Próximos eventos" description="Esta semana" />
          <CardBody style={{ paddingTop: 8 }}>
            {[
              { nome: 'Casamento Ana & João', data: '05/07', tag: 'em_andamento' },
              { nome: 'Aniversário 50 anos', data: '06/07', tag: 'aprovado' },
              { nome: 'Corporativo Verde SA', data: '08/07', tag: 'rascunho' },
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                borderTop: i ? '1px solid hsl(var(--border))' : 'none' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40,
                  borderRadius: 'var(--radius-md)', background: 'hsl(var(--accent))', color: 'hsl(var(--clay))', flexShrink: 0 }}>
                  <Icon.Calendario size={20} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{e.nome}</div>
                  <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>{e.data}</div>
                </div>
                <StatusBadge status={e.tag} />
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card style={{ marginTop: 16 }}>
        <CardHeader title="Contas a receber" description="Vencimentos próximos"
          action={<Button variant="ghost" size="sm" rightIcon={<Icon.Seta size={16} />}>Ver todas</Button>} />
        <CardBody style={{ padding: '4px 8px 8px' }}>
          <Table
            columns={[
              { key: 'cliente', header: 'Cliente' },
              { key: 'doc', header: 'Documento', hideBelow: 'md' },
              { key: 'venc', header: 'Vencimento', hideBelow: 'sm' },
              { key: 'valor', header: 'Valor', align: 'right', tabular: true },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            data={[
              { id: 1, cliente: 'Buffê Jardim', doc: 'OS-1042', venc: '04/07/2026', valor: 'R$ 2.400,00', status: 'pendente' },
              { id: 2, cliente: 'Casamento Ana & João', doc: 'OS-1043', venc: '06/07/2026', valor: 'R$ 5.180,00', status: 'aprovado' },
              { id: 3, cliente: 'Verde SA', doc: 'OS-1039', venc: '30/06/2026', valor: 'R$ 1.320,00', status: 'atrasado' },
              { id: 4, cliente: 'Maria Silva', doc: 'OS-1044', venc: '10/07/2026', valor: 'R$ 780,00', status: 'pago' },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  );
}

window.PainelScreen = PainelScreen;
})();
