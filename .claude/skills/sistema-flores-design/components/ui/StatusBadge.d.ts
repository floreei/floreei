import { CSSProperties } from 'react';

export type BusinessStatus =
  | 'pago' | 'recebido' | 'pendente' | 'atrasado' | 'vencido'
  | 'rascunho' | 'aprovado' | 'cancelado' | 'em_andamento';

/**
 * Badge de status de negócio (pill com ponto colorido).
 * @startingPoint section="Feedback" subtitle="Status de negócio — pago, pendente, atrasado" viewport="700x120"
 */
export interface StatusBadgeProps {
  /** Status de negócio conhecido — define cor e rótulo pt-BR. */
  status: BusinessStatus | string;
  /** Sobrescreve o rótulo exibido. */
  label?: string;
  style?: CSSProperties;
}

export function StatusBadge(props: StatusBadgeProps): JSX.Element;
