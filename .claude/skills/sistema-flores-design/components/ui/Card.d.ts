import { ReactNode, CSSProperties } from 'react';

/**
 * Superfície de conteúdo branca com sombra em camadas.
 * @startingPoint section="Superfícies" subtitle="Card com header, body e footer" viewport="700x260"
 */
export interface CardProps { children?: ReactNode; style?: CSSProperties; }
export interface CardHeaderProps {
  /** Título de seção — sans semibold, não serif. */
  title?: ReactNode;
  description?: ReactNode;
  /** Ação à direita (botão, menu). */
  action?: ReactNode;
  children?: ReactNode;
  style?: CSSProperties;
}
export interface CardSectionProps { children?: ReactNode; style?: CSSProperties; }

export function Card(props: CardProps): JSX.Element;
export function CardHeader(props: CardHeaderProps): JSX.Element;
export function CardBody(props: CardSectionProps): JSX.Element;
export function CardFooter(props: CardSectionProps): JSX.Element;
