import { ReactNode } from 'react';

export interface DropdownItem {
  label?: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  separator?: boolean;
}
export interface DropdownMenuProps {
  /** Elemento gatilho (ex.: IconButton com "…"). */
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'end';
}
/** Menu de ações ancorado. Fecha ao clicar fora. */
export function DropdownMenu(props: DropdownMenuProps): JSX.Element;
