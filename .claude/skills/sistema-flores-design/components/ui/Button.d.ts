import { ReactNode, CSSProperties } from 'react';

/**
 * Botão de ação do Sistema Flores.
 * @startingPoint section="Ações" subtitle="Botões — pinho, argila, ghost" viewport="700x120"
 */
export interface ButtonProps {
  /** Estilo visual. @default 'primary' */
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'clay' | 'destructive';
  /** Tamanho / altura do alvo de toque. @default 'md' (44px) */
  size?: 'sm' | 'md' | 'lg';
  /** Mostra spinner e desabilita. @default false */
  loading?: boolean;
  disabled?: boolean;
  /** Ocupa 100% da largura do contêiner. */
  fullWidth?: boolean;
  /** Ícone (lucide-react) à esquerda do rótulo. */
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  children?: ReactNode;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Botão de ação. Use `primary` para a ação principal da tela, `clay` para
 * ênfase pontual, `destructive` para exclusões, `ghost`/`outline` para ações
 * secundárias.
 */
export function Button(props: ButtonProps): JSX.Element;
