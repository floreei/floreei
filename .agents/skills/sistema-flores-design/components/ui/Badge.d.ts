import { ReactNode, CSSProperties } from 'react';

export interface BadgeProps {
  variant?: 'neutral' | 'primary' | 'clay' | 'success' | 'warning' | 'destructive' | 'outline';
  children?: ReactNode;
  style?: CSSProperties;
}

/** Etiqueta compacta tonal. Para status de negócio use `StatusBadge`. */
export function Badge(props: BadgeProps): JSX.Element;
