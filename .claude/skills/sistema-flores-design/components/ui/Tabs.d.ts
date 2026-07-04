import { ReactNode, CSSProperties } from 'react';

export interface TabItem { value: string; label: ReactNode; icon?: ReactNode; }
export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  style?: CSSProperties;
}
/** Abas em pílula sobre trilho `muted`. Controlado ou não-controlado. */
export function Tabs(props: TabsProps): JSX.Element;
