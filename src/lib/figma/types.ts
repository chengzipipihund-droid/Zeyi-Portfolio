// Shapes of the generated Figma data (src/data/figma/*.json, written by scripts/figma-import.mjs).

export type Sizing = 'FIXED' | 'HUG' | 'FILL';
export type Align = 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN' | 'BASELINE';

export type FigmaLayout = {
  mode: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  gap?: number;
  padding?: [number, number, number, number]; // top, right, bottom, left
  primaryAlign?: Align;
  counterAlign?: Align;
  primarySizing?: 'FIXED' | 'AUTO';
  counterSizing?: 'FIXED' | 'AUTO';
  wrap?: 'NO_WRAP' | 'WRAP';
  clips?: boolean;
  strokesInLayout?: boolean;
  counterGap?: number;
};

/** Typography of a text layer without a Pegboard text style (same shape as a text style). */
export type FigmaFont = {
  fontFamily: string;
  fontWeight: number;
  italic: boolean;
  fontSize: number;
  lineHeight: string;
  letterSpacing: string;
  textCase?: string;
  textDecoration?: string;
};

export type FigmaText = { layer: string; text: string };

export type FigmaNode = {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cx?: number;
  cy?: number;
  rotation?: number;
  visible?: boolean;
  opacity?: number;
  fills?: string[] | 'mixed';
  strokes?: string[];
  strokeWeight?: number | 'mixed';
  strokeAlign?: 'INSIDE' | 'CENTER' | 'OUTSIDE';
  /** Per-side weights [top, right, bottom, left] when strokeWeight is 'mixed'. */
  strokeSides?: [number, number, number, number];
  dash?: number[];
  radius?: number | number[];
  effect?: string;
  /** Effect without a Pegboard style, as CSS. */
  effectCss?: { boxShadow: string; dropShadow: string };
  /** Vector art exported as an SVG asset (figmaSvg key); `artBox` = its rendered box in the parent (rotation baked in). */
  asset?: string;
  artBox?: { x: number; y: number; w: number; h: number };
  /** Image fill exported as PNG (src/data/figma/images.json key). */
  image?: string;
  text?: string;
  textStyle?: string | null;
  align?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  autoResize?: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE';
  font?: FigmaFont;
  component?: string | null;
  variant?: Record<string, string>;
  props?: Record<string, string | boolean>;
  modes?: Record<string, string>;
  texts?: FigmaText[];
  layout?: FigmaLayout;
  absolute?: boolean;
  sizing?: [Sizing, Sizing];
  note?: string;
  children?: FigmaNode[];
};

/** A node of a layout JSON: FigmaNode plus its CSS-ready box inside the 1440×1024 frame (or its parent). */
export type LayoutNode = FigmaNode & {
  css?: { left: number; top: number; width: number; height: number; rotate: number };
  children?: LayoutNode[];
};

export type ComponentProperty = { type: 'TEXT' | 'BOOLEAN' | 'INSTANCE_SWAP' | 'VARIANT'; default: string | boolean; options?: string[] };

export type ComponentSpec = {
  id: string;
  type: 'COMPONENT' | 'COMPONENT_SET';
  properties?: Record<string, ComponentProperty>;
  variants?: { name: string; variant: Record<string, string>; tree: FigmaNode }[];
  tree?: FigmaNode;
};
