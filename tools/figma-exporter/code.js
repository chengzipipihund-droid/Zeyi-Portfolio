// Pegboard Exporter — a local Figma development plugin for zeyi-cheng.org
// Exports everything the home page needs from the Figma file into ONE file, figma-export.json:
//   tokens (variables, all modes) · text/effect styles · layouts of T0, T0 hovers, T0.5, T1
//   · component specs · SVG assets · motion keyframes (Animation A + T0 hovers)
//   · reference PNGs of every state frame and of the Animation A storyboard
// Then run `npm run figma:import -- <path-to-figma-export.json>` in the repo.
//
// The CORE section only uses the Figma Plugin API, so it can also be run through
// the Figma MCP `use_figma` tool. The UI section at the bottom only runs inside Figma.

// ============================== CONFIG ==============================
const CONFIG = {
  fileKey: 'gFWtnlIFWIpwDxI1ZwHm9v',
  pageName: 'Pegboard v2 — Shadow Board',
  stateSectionPrefix: 'C2 ·',                // the section that holds T0 … T5 and Animation A
  // Frames whose element positions are exported (key → frame name prefix)
  layoutFrames: [
    { key: 't0', prefix: 'T0 Home Page' },
    { key: 't0-hover-hi', prefix: 'T0 · Hover hi' },
    { key: 't0-hover-bin', prefix: 'T0 · Hover bin' },
    { key: 't0-5', prefix: 'T0.5' },
    { key: 't1', prefix: 'T1 · Rest' },
  ],
  // Frames whose Figma-motion keyframes are exported
  motionFrames: [
    { key: 'animation-a', prefix: 'Animation A · T0' },
    { key: 't0-hover-hi', prefix: 'T0 · Hover hi' },
    { key: 't0-hover-bin', prefix: 'T0 · Hover bin' },
  ],
  // Frames rendered to PNG as visual references (name test)
  referenceTest: (name) => /^T\d/.test(name) || name.startsWith('Animation A · storyboard'),
  collectionPrefix: 'Pegboard',              // only "Pegboard / …" variable collections
  stylePrefix: 'Pegboard/',                  // only "Pegboard/…" text + effect styles
  // SVG assets: component sets (every variant) and single components, matched by name prefix
  svgSets: [
    { prefix: 'Prop/', group: 'props' },
    { prefix: 'Peg/Hook', group: 'hardware' },
    { prefix: 'Object', exact: true, group: 'hardware', hideLayers: ['Label plate'] }, // bins: label plate is rebuilt in React
  ],
  svgComponents: [
    { prefix: 'Icon/Project/', group: 'icons' },
    { prefix: 'Shelf', group: 'hardware' },
  ],
  // Components rebuilt as React from a structural spec (text, layout, colours)
  specNames: [
    'Project Card', 'Detail Board', 'Tag/Skill', 'Nav/Tab', 'Toggle/Lang', 'Lamp/Status',
    'Plate/Nameplate', 'Badge/Edu', 'Object/Clipboard', 'Object/Note', 'Object', 'Board/Panel', 'Board/Hole',
  ],
  pngScale: 1,
};

// ============================== CORE ==============================
const round = (v, d = 2) => (typeof v === 'number' ? Math.round(v * 10 ** d) / 10 ** d : v);
const slug = (s) => String(s).toLowerCase().replace(/\+/g, ' plus').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const cssVar = (name) => '--' + slug(String(name).replace(/\//g, ' '));
const hex2 = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
const colorCss = (c, opacity = 1) => {
  const a = (c.a === undefined ? 1 : c.a) * (opacity === undefined ? 1 : opacity);
  if (a >= 0.999) return ('#' + hex2(c.r) + hex2(c.g) + hex2(c.b)).toUpperCase();
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${round(a, 3)})`;
};

const _varCache = new Map();
const _colCache = new Map();
async function varInfo(id) {
  if (_varCache.has(id)) return _varCache.get(id);
  const v = await figma.variables.getVariableByIdAsync(id);
  let collection = '';
  if (v) {
    if (!_colCache.has(v.variableCollectionId)) {
      const col = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
      _colCache.set(v.variableCollectionId, col ? col.name : '');
    }
    collection = _colCache.get(v.variableCollectionId);
  }
  // Only variables from the "Pegboard / …" collections become CSS variables.
  const exported = collection.startsWith(CONFIG.collectionPrefix);
  const info = v ? { name: v.name, css: cssVar(v.name), collection, exported } : { name: id, css: '--unknown', collection: '', exported: false };
  _varCache.set(id, info);
  return info;
}

async function paintsCss(paints) {
  if (!Array.isArray(paints)) return 'mixed';
  const out = [];
  for (const p of paints) {
    if (p.visible === false) continue;
    if (p.type === 'SOLID') {
      const b = p.boundVariables && p.boundVariables.color;
      const vi = b ? await varInfo(b.id) : null;
      if (vi && vi.exported) {
        out.push(p.opacity !== undefined && p.opacity < 1 ? `var(${vi.css}) @${round(p.opacity, 3)}` : `var(${vi.css})`);
      } else out.push(colorCss(p.color, p.opacity) + (vi ? ` /* ${vi.collection}: ${vi.name} */` : ''));
    } else if (p.type && p.type.startsWith('GRADIENT')) {
      out.push(`${p.type.toLowerCase()}(${p.gradientStops.map((s) => colorCss(s.color) + ' ' + round(s.position * 100, 1) + '%').join(', ')})`);
    } else if (p.type === 'IMAGE') out.push('image');
  }
  return out;
}

function unitFor(name) {
  return /radius|unit|gap|pad|width|height|stroke|space|size|offset/i.test(name) ? 'px' : '';
}

async function exportTokens() {
  const cols = (await figma.variables.getLocalVariableCollectionsAsync()).filter((c) => c.name.startsWith(CONFIG.collectionPrefix));
  const out = [];
  for (const c of cols) {
    const modes = c.modes.map((m) => ({ id: m.modeId, name: m.name, slug: slug(m.name) }));
    const variables = [];
    for (const id of c.variableIds) {
      const v = await figma.variables.getVariableByIdAsync(id);
      if (!v) continue;
      const values = {};
      for (const m of modes) {
        const raw = v.valuesByMode[m.id];
        if (raw && typeof raw === 'object' && raw.type === 'VARIABLE_ALIAS') values[m.slug] = { alias: (await varInfo(raw.id)).css };
        else if (v.resolvedType === 'COLOR') values[m.slug] = { value: colorCss(raw) };
        else if (v.resolvedType === 'FLOAT') values[m.slug] = { value: raw, unit: unitFor(v.name) };
        else values[m.slug] = { value: raw };
      }
      variables.push({ name: v.name, css: cssVar(v.name), type: v.resolvedType, description: v.description || '', values });
    }
    const def = c.modes.find((m) => m.modeId === c.defaultModeId) || c.modes[0];
    out.push({ name: c.name, key: slug(c.name.replace(/^Pegboard\s*\/\s*/i, '')), defaultMode: slug(def.name), modes: modes.map(({ name, slug: s }) => ({ name, slug: s })), variables });
  }
  return out;
}

const WEIGHTS = { thin: 100, hairline: 100, extralight: 200, ultralight: 200, light: 300, regular: 400, normal: 400, book: 400, medium: 500, semibold: 600, demibold: 600, bold: 700, extrabold: 800, ultrabold: 800, black: 900, heavy: 900 };
function fontWeight(style) {
  const s = String(style).toLowerCase().replace(/italic/g, '').replace(/[\s_-]/g, '');
  return WEIGHTS[s] || 400;
}
function lineHeightCss(lh) {
  if (!lh || lh.unit === 'AUTO') return 'normal';
  if (lh.unit === 'PIXELS') return round(lh.value, 2) + 'px';
  return String(round(lh.value / 100, 4));
}
function letterSpacingCss(ls) {
  if (!ls || !ls.value) return '0';
  return ls.unit === 'PERCENT' ? round(ls.value / 100, 4) + 'em' : round(ls.value, 2) + 'px';
}

async function exportTextStyles() {
  const styles = (await figma.getLocalTextStylesAsync()).filter((s) => s.name.startsWith(CONFIG.stylePrefix));
  return styles.map((s) => ({
    name: s.name,
    className: 'type-' + slug(s.name.slice(CONFIG.stylePrefix.length)),
    fontFamily: s.fontName.family,
    fontStyle: s.fontName.style,
    fontWeight: fontWeight(s.fontName.style),
    italic: /italic/i.test(s.fontName.style),
    fontSize: s.fontSize,
    lineHeight: lineHeightCss(s.lineHeight),
    letterSpacing: letterSpacingCss(s.letterSpacing),
    textCase: s.textCase,
    textDecoration: s.textDecoration,
  }));
}

async function exportEffectStyles() {
  const styles = (await figma.getLocalEffectStylesAsync()).filter((s) => s.name.startsWith(CONFIG.stylePrefix));
  return styles.map((s) => {
    const shadows = s.effects.filter((e) => e.visible !== false && (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW'));
    return {
      name: s.name,
      css: cssVar(s.name.slice(CONFIG.stylePrefix.length).replace(/·/g, ' ')),
      boxShadow: shadows.map((e) => `${e.type === 'INNER_SHADOW' ? 'inset ' : ''}${round(e.offset.x)}px ${round(e.offset.y)}px ${round(e.radius)}px ${round(e.spread || 0)}px ${colorCss(e.color)}`).join(', '),
      dropShadow: shadows.filter((e) => e.type === 'DROP_SHADOW').map((e) => `drop-shadow(${round(e.offset.x)}px ${round(e.offset.y)}px ${round(e.radius / 2)}px ${colorCss(e.color)})`).join(' '),
    };
  });
}

async function styleName(id) {
  if (!id || typeof id !== 'string') return id === figma.mixed ? 'mixed' : null;
  const s = await figma.getStyleByIdAsync(id);
  return s ? s.name : null;
}

async function explicitModes(node) {
  const m = node.explicitVariableModes || {};
  const out = {};
  for (const [colId, modeId] of Object.entries(m)) {
    const col = await figma.variables.getVariableCollectionByIdAsync(colId);
    if (!col) continue;
    const mode = col.modes.find((x) => x.modeId === modeId);
    out[slug(col.name.replace(/^Pegboard\s*\/\s*/i, ''))] = mode ? slug(mode.name) : modeId;
  }
  return Object.keys(out).length ? out : undefined;
}

function layoutInfo(n) {
  if (!('layoutMode' in n) || n.layoutMode === 'NONE') return { mode: 'NONE', clips: 'clipsContent' in n ? n.clipsContent : undefined };
  return {
    mode: n.layoutMode, gap: n.itemSpacing, padding: [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft],
    primaryAlign: n.primaryAxisAlignItems, counterAlign: n.counterAxisAlignItems,
    primarySizing: n.primaryAxisSizingMode, counterSizing: n.counterAxisSizingMode, wrap: n.layoutWrap, clips: n.clipsContent,
  };
}

async function describe(node, origin, depth, opts = {}) {
  const bb = node.absoluteBoundingBox;
  const d = {
    id: node.id, name: node.name, type: node.type,
    x: round(node.x), y: round(node.y), w: round(node.width), h: round(node.height),
  };
  if (bb) { d.cx = round(bb.x - origin.x + bb.width / 2); d.cy = round(bb.y - origin.y + bb.height / 2); }
  if (node.rotation) d.rotation = round(node.rotation, 2);
  if (node.visible === false) d.visible = false;
  if ('opacity' in node && node.opacity < 1) d.opacity = round(node.opacity, 3);
  if ('fills' in node) { const f = await paintsCss(node.fills); if (f === 'mixed' || f.length) d.fills = f; }
  if ('strokes' in node && node.strokes.length) {
    d.strokes = await paintsCss(node.strokes);
    d.strokeWeight = node.strokeWeight === figma.mixed ? 'mixed' : node.strokeWeight;
    if (node.dashPattern && node.dashPattern.length) d.dash = node.dashPattern;
    d.strokeAlign = node.strokeAlign;
  }
  if ('cornerRadius' in node) d.radius = node.cornerRadius === figma.mixed ? [node.topLeftRadius, node.topRightRadius, node.bottomRightRadius, node.bottomLeftRadius] : node.cornerRadius || undefined;
  if ('effects' in node && node.effects.length) d.effect = (await styleName(node.effectStyleId)) || 'custom';
  if (node.type === 'TEXT') {
    d.text = node.characters;
    d.textStyle = await styleName(node.textStyleId);
    d.align = node.textAlignHorizontal;
    d.autoResize = node.textAutoResize;
  }
  if (node.type === 'INSTANCE') {
    const main = await node.getMainComponentAsync();
    const set = main && main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent : null;
    d.component = set ? set.name : main ? main.name : null;
    if (set) d.variant = main.variantProperties;
    const props = {};
    for (const [k, p] of Object.entries(node.componentProperties || {})) {
      if (p.type === 'VARIANT') continue;
      const key = k.split('#')[0];
      if (p.type === 'INSTANCE_SWAP') { const c = await figma.getNodeByIdAsync(p.value); props[key] = c ? c.name : p.value; }
      else props[key] = p.value;
    }
    if (Object.keys(props).length) d.props = props;
    const modes = await explicitModes(node);
    if (modes) d.modes = modes;
    const texts = node.findAll((n) => n.type === 'TEXT' && n.visible).slice(0, 60).map((t) => ({ layer: t.name, text: t.characters }));
    if (texts.length) d.texts = texts;
    if (opts.expandInstances && depth < 10) d.children = await kids(node, origin, depth, opts);
    return d;
  }
  if ('children' in node) {
    d.layout = layoutInfo(node);
    const modes = await explicitModes(node);
    if (modes) d.modes = modes;
    if (opts.collapseArt && /^art$/i.test(node.name)) { d.note = 'vector art — use the exported SVG'; return d; }
    if (depth < 10) d.children = await kids(node, origin, depth, opts);
  }
  return d;
}
async function kids(node, origin, depth, opts) {
  const out = [];
  for (const c of node.children) out.push(await describe(c, origin, depth + 1, opts));
  return out;
}

async function exportSpecs(page) {
  const out = {};
  const nodes = page.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] });
  for (const name of CONFIG.specNames) {
    const node = nodes.find((n) => n.name === name && (n.type === 'COMPONENT_SET' || n.parent.type !== 'COMPONENT_SET'));
    if (!node) { out[name] = { missing: true }; continue; }
    if (node.type === 'COMPONENT_SET') {
      const defs = {};
      for (const [k, v] of Object.entries(node.componentPropertyDefinitions)) defs[k.split('#')[0]] = { type: v.type, default: v.defaultValue, options: v.variantOptions };
      const variants = [];
      for (const v of node.children) {
        const o = v.absoluteBoundingBox;
        variants.push({ name: v.name, variant: v.variantProperties, tree: await describe(v, { x: o.x, y: o.y }, 0, { collapseArt: true }) });
      }
      out[name] = { id: node.id, type: 'COMPONENT_SET', properties: defs, variants };
    } else {
      const o = node.absoluteBoundingBox;
      out[name] = { id: node.id, type: 'COMPONENT', tree: await describe(node, { x: o.x, y: o.y }, 0, { collapseArt: true }) };
    }
  }
  return out;
}

// Paints bound to variables are swapped for unique sentinel colours before export,
// so the importer can turn them back into CSS variables (theme-aware SVGs).
function sentinel(i) { return '#FE' + i.toString(16).padStart(4, '0').toUpperCase(); }
function hexToRgb(h) { return { r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 }; }

async function exportSvg(component, counter, hideLayers) {
  const inst = component.createInstance();
  inst.x = -200000; inst.y = -200000;
  const tokens = {};
  const byVar = {};
  try {
    if (hideLayers && hideLayers.length) for (const n of inst.findAll((x) => hideLayers.includes(x.name))) n.visible = false;
    for (const n of [inst, ...inst.findAll(() => true)]) {
      if ('effects' in n && n.effects.length) n.effects = [];
      for (const prop of ['fills', 'strokes']) {
        if (!(prop in n) || !Array.isArray(n[prop]) || !n[prop].length) continue;
        let changed = false;
        const next = [];
        for (const p of n[prop]) {
          const b = p.type === 'SOLID' && p.boundVariables && p.boundVariables.color;
          if (b && (await varInfo(b.id)).exported) {
            if (!byVar[b.id]) { byVar[b.id] = sentinel(counter.i++); tokens[byVar[b.id]] = (await varInfo(b.id)).css; }
            next.push({ type: 'SOLID', color: hexToRgb(byVar[b.id]), opacity: p.opacity === undefined ? 1 : p.opacity, visible: p.visible !== false, blendMode: p.blendMode || 'NORMAL' });
            changed = true;
          } else next.push(p);
        }
        if (changed) n[prop] = next;
      }
    }
    const svg = await inst.exportAsync({ format: 'SVG_STRING', svgIdAttribute: false, svgOutlineText: true, svgSimplifyStroke: true });
    return { svg, tokens };
  } finally {
    inst.remove();
  }
}

function findNamed(root, re) {
  return 'findOne' in root ? root.findOne((n) => re.test(n.name)) : null;
}
function relBox(node, origin) {
  const b = node.absoluteBoundingBox;
  return b ? { x: round(b.x - origin.x), y: round(b.y - origin.y), w: round(b.width), h: round(b.height) } : null;
}

async function exportAssets(page, onProgress) {
  const counter = { i: 1 };
  const assets = {};
  const all = page.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] });
  const jobs = [];
  for (const rule of CONFIG.svgSets) {
    for (const set of all.filter((n) => n.type === 'COMPONENT_SET' && (rule.exact ? n.name === rule.prefix : n.name.startsWith(rule.prefix)))) {
      const base = slug(set.name.slice(rule.prefix.length) || set.name);
      for (const v of set.children) {
        const state = Object.values(v.variantProperties || {}).map(slug).join('-');
        jobs.push({ key: `${base || slug(set.name)}-${state}`, group: rule.group, node: v, source: `${set.name} / ${v.name}`, hide: rule.hideLayers });
      }
    }
  }
  for (const rule of CONFIG.svgComponents) {
    for (const c of all.filter((n) => n.type === 'COMPONENT' && n.parent.type !== 'COMPONENT_SET' && n.name.startsWith(rule.prefix))) {
      jobs.push({ key: slug(c.name.slice(rule.prefix.length) || c.name), group: rule.group, node: c, source: c.name });
    }
  }
  let done = 0;
  for (const job of jobs) {
    const o = job.node.absoluteBoundingBox;
    const { svg, tokens } = await exportSvg(job.node, counter, job.hide);
    const collider = findNamed(job.node, /^collider$/i);
    const anchor = findNamed(job.node, /^anchor$/i);
    const art = findNamed(job.node, /^art$/i);
    assets[job.key] = {
      group: job.group, source: job.source, componentId: job.node.id,
      w: round(job.node.width), h: round(job.node.height),
      art: art ? relBox(art, o) : null,
      collider: collider ? relBox(collider, o) : null,
      anchor: anchor ? (() => { const b = relBox(anchor, o); return { x: round(b.x + b.w / 2), y: round(b.y + b.h / 2) }; })() : null,
      tokens, svg,
    };
    done++;
    if (onProgress && done % 5 === 0) onProgress(`SVG ${done}/${jobs.length}`);
  }
  return assets;
}

function refKey(name) {
  const m = name.match(/^Animation A · storyboard · t = ([\d.]+)/);
  if (m) return 'anim-a-' + m[1].replace('.', '-');
  return slug(name.split(' — ')[0]);
}

async function exportReferences(section, log) {
  const out = {};
  if (!section) return out;
  const frames = section.children.filter((n) => n.type === 'FRAME' && CONFIG.referenceTest(n.name));
  let i = 0;
  for (const f of frames) {
    const bytes = await f.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: CONFIG.pngScale } });
    out[refKey(f.name)] = { name: f.name, nodeId: f.id, w: f.width, h: f.height, png: figma.base64Encode(bytes) };
    if (log && ++i % 4 === 0) log(`PNG ${i}/${frames.length}`);
  }
  return out;
}

// Figma-motion keyframes → plain data. Values: FLOAT → number, VECTOR → {x,y}, COLOR → {r,g,b,a}.
// Transform tracks compose with the node's resting transform (TRANSLATION_* add px, ROTATION adds degrees
// counter-clockwise, SCALE_* multiply, all around the node's centre). OPACITY replaces the node's opacity.
function kfValue(v) { return v && (v.type === 'FLOAT' || v.type === 'VECTOR' || v.type === 'COLOR') ? v.value : v; }
async function exportMotion(frame) {
  const origin = frame.absoluteBoundingBox;
  const nodes = [];
  let duration = null;
  const all = frame.findAll(() => true);
  for (const n of all) {
    if (duration === null && n.timelines && n.timelines.length) duration = n.timelines[0].duration;
    const tracks = n.manualKeyframeTracks || {};
    const styles = n.animationStyles || [];
    const keys = Object.keys(tracks).filter((k) => !['fills', 'strokes', 'effects'].includes(k));
    if (!keys.length && !styles.length) continue;
    const path = []; for (let p = n; p && p !== frame; p = p.parent) path.unshift(p.name);
    const b = n.absoluteBoundingBox;
    const d = {
      id: n.id, name: n.name, path: path.join(' / '), type: n.type,
      box: { x: round(n.x), y: round(n.y), w: round(n.width), h: round(n.height) },
      center: b ? { x: round(b.x - origin.x + b.width / 2), y: round(b.y - origin.y + b.height / 2) } : null,
      rotation: round(n.rotation || 0, 2), opacity: round(n.opacity, 3),
      wrapper: /^(Hang|Fly|Motion) · /.test(n.name) ? 'pivot = centre of this box; children keep their own static transform' : undefined,
      tracks: {},
    };
    if (n.type === 'INSTANCE') { const m = await n.getMainComponentAsync(); d.component = m && m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.name + ' / ' + m.name : m && m.name; }
    for (const k of keys) d.tracks[k] = tracks[k].keyframes.map((kf) => ({ t: round(kf.timelinePosition, 3), v: kfValue(kf.value), ease: kf.easing || null }));
    if (styles.length) d.styles = styles.map((s) => ({ styleId: s.styleId, name: s.name, duration: s.duration, timelineOffset: s.timelineOffset, props: s.props }));
    nodes.push(d);
  }
  return { frame: frame.name, nodeId: frame.id, w: frame.width, h: frame.height, duration, nodes };
}

async function pegboardExport(opts = {}) {
  const log = opts.onProgress || (() => {});
  const page = figma.root.children.find((p) => p.name === CONFIG.pageName);
  if (!page) throw new Error(`Page "${CONFIG.pageName}" not found`);
  await figma.setCurrentPageAsync(page);
  const section = page.children.find((n) => n.type === 'SECTION' && n.name.startsWith(CONFIG.stateSectionPrefix));
  if (!section) throw new Error(`Section "${CONFIG.stateSectionPrefix}…" not found`);
  const frameBy = (prefix) => section.children.find((n) => n.type === 'FRAME' && n.name.startsWith(prefix));
  log('tokens…');
  const tokens = await exportTokens();
  const textStyles = await exportTextStyles();
  const effects = await exportEffectStyles();
  log('layouts…');
  const layouts = {};
  for (const lf of CONFIG.layoutFrames) {
    const f = frameBy(lf.prefix);
    if (!f) { layouts[lf.key] = { missing: lf.prefix }; continue; }
    const o = f.absoluteBoundingBox;
    layouts[lf.key] = { frame: { id: f.id, name: f.name, w: f.width, h: f.height, fills: await paintsCss(f.fills) }, items: await kids(f, { x: o.x, y: o.y }, 0, { collapseArt: true }) };
  }
  log('motion…');
  const motion = {};
  for (const mf of CONFIG.motionFrames) { const f = frameBy(mf.prefix); motion[mf.key] = f ? await exportMotion(f) : { missing: mf.prefix }; }
  log('component specs…');
  const specs = await exportSpecs(page);
  log('SVG assets…');
  const assets = opts.svg === false ? {} : await exportAssets(page, log);
  let references = {};
  if (opts.png) { log('reference PNGs…'); references = await exportReferences(section, log); }
  return {
    meta: { version: 2, file: figma.root.name, fileKey: CONFIG.fileKey, page: page.name, section: section.name, exportedAt: new Date().toISOString() },
    tokens, textStyles, effects, layouts, motion, specs, assets, references,
  };
}

// ============================== UI (Figma only) ==============================
if (typeof __html__ !== 'undefined') {
  figma.showUI(__html__, { width: 360, height: 300, themeColors: true });
  figma.ui.onmessage = async (msg) => {
    if (!msg || msg.type !== 'export') return;
    try {
      const data = await pegboardExport({ png: !!msg.png, onProgress: (text) => figma.ui.postMessage({ type: 'progress', text }) });
      const n = Object.keys(data.assets).length;
      figma.ui.postMessage({ type: 'done', json: JSON.stringify(data), summary: `${data.tokens.length} collections · ${Object.keys(data.layouts).length} layouts · ${Object.keys(data.motion).length} motion frames · ${n} SVGs · ${Object.keys(data.references).length} PNGs` });
    } catch (e) {
      figma.ui.postMessage({ type: 'error', text: String((e && e.stack) || e) });
    }
  };
}
