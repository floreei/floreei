import { ReactNode, CSSProperties } from 'react';

/**
 * Cabeçalho de página com título serif (Fraunces).
 * @startingPoint section="Layout" subtitle="Cabeçalho de página serif + ações" viewport="700x150"
 */
export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Ações à direita (ex.: botão "Novo"). */
  actions?: ReactNode;
  /** Legenda curta acima do título (caps). */
  eyebrow?: ReactNode;
  style?: CSSProperties;
}
export function PageHeader(props: PageHeaderProps): JSX.Element;
