import type { CSSProperties } from 'react';
import type { FigmaFont, FigmaNode } from './types';

// Same slug as scripts/figma-import.mjs, so names map onto the generated classes and CSS variables.
const slug = (s: string) => s.toLowerCase().replace(/\+/g, ' plus').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** "Pegboard/Title M" → "type-title-m" (class in tokens.css). */
export function textStyleClass(textStyle: string | null | undefined): string | undefined {
  if (!textStyle || textStyle === 'mixed') return undefined;
  return 'type-' + slug(textStyle.replace(/^Pegboard\s*\/\s*/i, ''));
}

/** "Pegboard/Shadow · Hang" → "var(--shadow-hang)" (tokens.css → Effects). */
export function shadowVar(effect: string | undefined): string | undefined {
  if (!effect || effect === 'custom') return undefined;
  return `var(--${slug(effect.replace(/^Pegboard\s*\/\s*/i, ''))})`;
}

/** One exported paint: "var(--x)", "#FFFFFF", or either with " @0.55" opacity. */
export function paintCss(paint: string): string | undefined {
  if (paint === 'image') return undefined;
  const [color, alpha] = paint.split(' @');
  return alpha ? `color-mix(in srgb, ${color} ${+alpha * 100}%, transparent)` : color;
}

/** Figma stacks fills bottom → top; CSS backgrounds list top → bottom. */
export function fillCss(fills: FigmaNode['fills']): string | undefined {
  if (!fills || fills === 'mixed') return undefined;
  const colors = fills.map(paintCss).filter((c): c is string => !!c);
  if (colors.length <= 1) return colors[0];
  return colors.reverse().map((c) => `linear-gradient(${c}, ${c})`).join(', ');
}

export function radiusCss(radius: FigmaNode['radius']): string | undefined {
  if (radius == null) return undefined;
  return Array.isArray(radius) ? radius.map((r) => `${r}px`).join(' ') : `${radius}px`;
}

/** Inline typography for text layers that have no Pegboard text style (values exported per layer). */
export function fontCss(font: FigmaFont): CSSProperties {
  const fallback = /mono/i.test(font.fontFamily) ? 'monospace' : /serif|gentium/i.test(font.fontFamily) ? 'serif' : 'sans-serif';
  return {
    // next/font variable when the family is self-hosted (layout.tsx); otherwise the installed font, then the generic family
    fontFamily: `var(--font-${slug(font.fontFamily)}, "${font.fontFamily}"), "${font.fontFamily}", ${fallback}`,
    fontSize: font.fontSize,
    fontWeight: font.fontWeight,
    fontStyle: font.italic ? 'italic' : undefined,
    lineHeight: font.lineHeight,
    letterSpacing: font.letterSpacing,
    textTransform: font.textCase === 'UPPER' ? 'uppercase' : font.textCase === 'LOWER' ? 'lowercase' : undefined,
    textDecoration: font.textDecoration === 'UNDERLINE' ? 'underline' : undefined,
  };
}

const ALIGN: Record<string, CSSProperties['justifyContent']> = { MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end', SPACE_BETWEEN: 'space-between', BASELINE: 'baseline' };
export const flexAlign = (a: string | undefined) => (a ? ALIGN[a] : undefined);
