/* __IIFE__ */
(function(){
const Icon = window.Icon;

function FinanceiroScreen() {
  const NS = window.SistemaFloresDesignSystem_d212f4;
  const { PageHeader, Button, Card, CardHeader, CardBody, Tabs, Table, StatusBadge } = NS;
  const [aba, setAba] = React.useState('receber');

  const receber = [
    { id: 1, cliente: 'Buffê Jardim', venc: '04/07/2026', valor: 'R$ 2.400,00', status: 'pendente' },
    { id: 2, cliente: 'Casamento Ana & João', venc: '06/07/2026', valor: 'R$ 5.180,00', status: 'aprovado' },
    { id: 3, cliente: 'Verde SA', venc: '30/06/2026', valor: 'R$ 1.320,00', status: 'atrasado' },
    { id: 4, cliente: 'Maria Silva', venc: '10/07/2026', valor: 'R$ 780,00', status: 'pago' },
  ];
  const pagar = [
    { id: 1, cliente: 'Atacado Flores Sul', venc: '05/07/2026', valor: 'R$ 1.980,00', status: 'pendente' },
    { id: 2, cliente: 'Embalagens Lima', venc: '02/07/2026', valor: 'R$ 460,00', status: 'atrasado' },
    { id: 3, cliente: 'Transporte Veloz', venc: '11/07/2026', valor: 'R$ 320,00', status: 'pago' },
  ];
  const dados = aba === 'pagar' ? pagar : receber;

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="A receber, a pagar, caixa e DRE em um só lugar."
        actions={<Button variant="outline" leftIcon={<Icon.Mais size={18} />}>Novo lançamento</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { l: 'Saldo em caixa', v: 'R$ 3.240,00', c: 'var(--primary)' },
          { l: 'A receber', v: 'R$ 18.420,00', c: 'var(--success)' },
          { l: 'A pagar', v: 'R$ 7.960,00', c: 'var(--destructive)' },
        ].map((s) => (
          <Card key={s.l}>
            <CardBody style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>{s.l}</div>
              <div className="tabular-nums" style={{ fontSize: 26, fontWeight: 700, color: `hsl(${s.c})`, fontVariantNumeric: 'tabular-nums', marginTop: 6, letterSpacing: '-0.01em' }}>{s.v}</div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Lançamentos"
          action={<Tabs value={aba} onValueChange={setAba} items={[
            { value: 'receber', label: 'A receber' },
            { value: 'pagar', label: 'A pagar' },
            { value: 'caixa', label: 'Caixa' },
          ]} />}
        />
        <CardBody style={{ padding: '4px 8px 8px' }}>
          {aba === 'caixa' ? (
            <div style={{ padding: '24px 12px' }}>
              {[
                { d: 'Recebimento — Maria Silva', v: '+ R$ 780,00', up: true },
                { d: 'Compra — Atacado Flores Sul', v: '− R$ 1.980,00', up: false },
                { d: 'Recebimento — Buffê Jardim', v: '+ R$ 1.200,00', up: true },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: i ? '1px solid hsl(var(--border))' : 'none' }}>
                  <span style={{ fontSize: 14.5, color: 'hsl(var(--foreground))' }}>{r.d}</span>
                  <span className="tabular-nums" style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: r.up ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}>{r.v}</span>
                </div>
              ))}
            </div>
          ) : (
            <Table
              columns={[
                { key: 'cliente', header: aba === 'pagar' ? 'Fornecedor' : 'Cliente' },
                { key: 'venc', header: 'Vencimento', hideBelow: 'sm' },
                { key: 'valor', header: 'Valor', align: 'right', tabular: true },
                { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                { key: 'acao', header: '', align: 'right', render: (r) => (
                  r.status === 'pago' ? <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Quitado</span>
                    : <Button size="sm" variant="outline">Baixar</Button>
                )},
              ]}
              data={dados}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}

window.FinanceiroScreen = FinanceiroScreen;
})();
