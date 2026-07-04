import { CSSProperties } from 'react';
export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: string;
  style?: CSSProperties;
}
/** Placeholder de carregamento com shimmer. Respeita prefers-reduced-motion. */
export function Skeleton(props: SkeletonProps): JSX.Element;
