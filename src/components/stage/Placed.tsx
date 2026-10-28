import type { CSSProperties, ReactNode } from 'react';
import type { LayoutNode } from '@/lib/figma/types';

/**
 * Puts a layout node at its Figma box (layout JSON `css`, stage px). Rotation pivots on the box centre.
 * If the instance was scaled in Figma (same ratio on both axes vs. the component's native size), the content is
 * drawn at native size and scaled — exactly like Figma's scale tool. Otherwise the box is the content size.
 */
export function Placed({
  node,
  native,
  children,
  className,
  style,
}: {
  node: LayoutNode;
  native?: { w: number; h: number };
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const css = node.css;
  if (!css) throw new Error(`Layout node "${node.name}" has no css box`);
  const sx = native ? css.width / native.w : 1;
  const sy = native ? css.height / native.h : 1;
  const scaled = native && Math.abs(sx - 1) > 0.005 && Math.abs(sx - sy) < 0.01;
  return (
    <div
      data-layer={node.name}
      className={className}
      style={{
        position: 'absolute',
        left: css.left,
        top: css.top,
        width: css.width,
        height: css.height,
        transform: css.rotate ? `rotate(${css.rotate}deg)` : undefined,
        ...style,
      }}
    >
      {scaled ? (
        <div style={{ width: native.w, height: native.h, transform: `scale(${sx})`, transformOrigin: '0 0' }}>{children}</div>
      ) : (
        children
      )}
    </div>
  );
}
