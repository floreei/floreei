import React from 'react';

/**
 * StatusBadge — badge semântico para status de negócio do ERP.
 * Mapeia status conhecidos para cor + rótulo pt-BR e um ponto indicador.
 */
const STATUS = {
  pago:      { label: 'Pago',      color: 'var(--success)' },
  recebido:  { label: 'Recebido',  color: 'var(--success)' },
  pendente:  { label: 'Pendente',  color: 'var(--warning)' },
  atrasado:  { label: 'Atrasado',  color: 'var(--destructive)' },
  vencido:   { label: 'Vencido',   color: 'var(--destructive)' },
  rascunho:  { label: 'Rascunho',  color: 'var(--muted-foreground)' },
  aprovado:  { label: 'Aprovado',  color: 'var(--primary)' },
  cancelado: { label: 'Cancelado', color: 'var(--muted-foreground)' },
  em_andamento: { label: 'Em andamento', color: 'var(--chart-3)' },
};

export function StatusBadge({ status, label, style = {}, ...rest }) {
  const cfg = STATUS[status] || { label: label || status, color: 'var(--muted-foreground)' };
  const text = label || cfg.label;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      height: 24, padding: '0 10px', borderRadius: 'var(--radius-full)',
      background: `hsl(${cfg.color} / 0.12)`, color: `hsl(${cfg.color})`,
      fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, lineHeight: 1,
      whiteSpace: 'nowrap', ...style,
    }} {...rest}>
      <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: `hsl(${cfg.color})` }} />
      {text}
    </span>
  );
}
