import { CSSProperties } from 'react';
export interface AvatarProps {
  src?: string;
  /** Nome — usado p/ iniciais e alt. */
  name?: string;
  /** Diâmetro em px. @default 36 */
  size?: number;
  style?: CSSProperties;
}
/** Avatar circular com iniciais ou imagem. */
export function Avatar(props: AvatarProps): JSX.Element;
