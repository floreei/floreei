/* __IIFE__ */
(function(){
const Icon = window.Icon;

function OrcamentosScreen({ onNew }) {
  const NS = window.SistemaFloresDesignSystem_d212f4;
  const { PageHeader, Button, Card, CardBody, Table, StatusBadge, DropdownMenu, EmptyState } = NS;

  const dados = [
    { id: 1, cliente: 'Casamento Ana & João', evento: 'Casamento', data: '06/07/2026', valor: 'R$ 5.180,00', status: 'aprovado' },
    { id: 2, cliente: 'Buffê Jardim', evento: 'Corporativo', data: '12/07/2026', valor: 'R$ 2.400,00', status: 'pendente' },
    { id: 3, cliente: 'Verde SA', evento: 'Inauguração', data: '18/07/2026', valor: 'R$ 1.320,00', status: 'rascunho' },
    { id: 4, cliente: 'Aniversário 50 anos', evento: 'Festa', data: '06/07/2026', valor: 'R$ 3.900,00', status: 'aprovado' },
  ];

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Crie e acompanhe propostas de eventos."
        actions={<Button leftIcon={<Icon.Mais size={18} />} onClick={onNew}>Novo orçamento</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { l: 'Abertos', v: '9', c: 'var(--primary)' },
          { l: 'Aprovados no mês', v: '14', c: 'var(--success)' },
          { l: 'Valor em negociação', v: 'R$ 22.400', c: 'var(--clay)' },
        ].map((s) => (
          <Card key={s.l}>
            <CardBody style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 4, height: 40, borderRadius: 4, background: `hsl(${s.c})` }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>{s.l}</div>
                <div className="tabular-nums" style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody style={{ padding: '4px 8px 8px' }}>
          <Table
            columns={[
              { key: 'cliente', header: 'Cliente' },
              { key: 'evento', header: 'Evento', hideBelow: 'md' },
              { key: 'data', header: 'Data', hideBelow: 'sm' },
              { key: 'valor', header: 'Valor', align: 'right', tabular: true },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'acoes', header: '', align: 'right', render: () => (
                <DropdownMenu trigger={<span style={{ display: 'inline-flex', padding: 6, borderRadius: 8, color: 'hsl(var(--muted-foreground))', cursor: 'pointer' }}><Icon.Reticencias size={18} /></span>}
                  items={[{ label: 'Ver detalhes' }, { label: 'Duplicar' }, { separator: true }, { label: 'Excluir', destructive: true }]} />
              )},
            ]}
            data={dados}
          />
        </CardBody>
      </Card>
    </div>
  );
}

window.OrcamentosScreen = OrcamentosScreen;
})();
