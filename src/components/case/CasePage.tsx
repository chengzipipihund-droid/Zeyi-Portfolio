import type { CSSProperties, ReactNode } from 'react';
import { projects, type Project } from '@/data/projects';
import { publicFileExists, type CaseData, type CaseNode, type CaseSection } from '@/lib/figma/cases';
import { CaseNodeView, findNode, type CaseCtx, type CaseLink } from './CaseNode';
import { BackToTop } from './BackToTop';
import { CASE_MOTION } from '@/styles/motion';
import { ChapterTabs } from './ChapterTabs';
import { CaseZoom } from './CaseZoom';
import { FilmButton, FilmStage, FilmVideo } from './Film';
import { SiteFooter, SiteHeader } from './SiteChrome';

// One case page (docs/case-pages-brief.md §3): the Figma sections top to bottom, each a landmark with
// data-figma-section="<key>" (npm run visual:case). Bodies come from the generic tree renderer; this file only adds
// what the tree can't say: links, headings, the film's video and button.

const byName = (tree: CaseNode, name: string) => findNode(tree, (n) => n.name === name);
const byNumber = (n: string | undefined) => projects.find((p) => p.number === n);

/** Where a project's case lives: its case page, or (no case page yet) its Detail Board on the board. */
export function projectHref(p: Project | undefined): string {
  if (!p) return '/home';
  return p.detail.caseHref ?? `/home?p=${p.slug}`;
}

/** The project this case page leads to: the card in its "Next tool" block. */
function nextProject(data: CaseData) {
  const next = data.sections.find((s) => s.kind === 'next');
  const card = next && findNode(next.tree, (n) => n.component === 'Project Card');
  return byNumber(card ? String(card.props?.Number) : String(+data.number + 1).padStart(2, '0'));
}

function Section({ section, ctx, as = 'section', label, scrollMargin }: { section: CaseSection; ctx: CaseCtx; as?: 'section' | 'nav'; label?: string; scrollMargin?: number }) {
  const Tag = as;
  const title = section.kind === 'chapter' ? `${section.anchor}-title` : undefined;
  return (
    <Tag data-figma-section={section.key} id={section.anchor} aria-labelledby={title} aria-label={title ? undefined : label} className="relative" style={{ scrollMarginTop: scrollMargin }}>
      <CaseNodeView node={section.tree} root ctx={ctx} />
    </Tag>
  );
}

function Film({ section }: { section: CaseSection }) {
  const tree = section.tree;
  const note = byName(tree, 'Placeholder note');
  const play = byName(tree, 'Play');
  const video = section.video && publicFileExists(section.video.src) ? section.video.src : null;
  const ctx: CaseCtx = {
    priority: true,
    // The note is a design note for Zeyi ("VIDEO · intro.mp4 … TODO(zeyi)"), never shown on the site.
    hide: new Set(note ? [note.id] : []),
    under: video && tree.media ? { [tree.id]: <FilmVideo src={video} poster={tree.media.src} /> } : undefined,
    extra:
      video && play
        ? { [tree.id]: <FilmButton style={{ position: 'absolute', left: play.x, top: play.y, width: play.w, height: play.h } satisfies CSSProperties} /> }
        : undefined,
  };
  return (
    <FilmStage data-figma-section={section.key} aria-label={section.name.replace(/^Intro film · /, 'Project film · ')} className="relative">
      <CaseNodeView node={tree} root ctx={ctx} />
    </FilmStage>
  );
}

export function CasePage({ data }: { data: CaseData }) {
  const self = byNumber(data.number);
  const next = nextProject(data);
  const nextHref = projectHref(next);
  const board = (p: Project | undefined): CaseLink => ({ href: p ? `/home?p=${p.slug}` : '/home' });

  // Chapter tabs stick under the site header: their empty top padding slides under it, the rail sits tabsGap below it.
  const headerH = data.sections.find((s) => s.kind === 'header')?.h ?? 0;
  const tabsSection = data.sections.find((s) => s.kind === 'tabs');
  const tabsPad = tabsSection?.tree.layout?.padding?.[0] ?? 0;
  const tabsTop = headerH + CASE_MOTION.tabsGap - tabsPad;
  const chapterMargin = tabsSection ? tabsTop + tabsSection.h : headerH;

  const out: ReactNode[] = [];
  let header: ReactNode = null;
  let footer: ReactNode = null;
  for (const s of data.sections) {
    const t = s.tree;
    const link = (name: string, l: CaseLink) => {
      const n = byName(t, name);
      return n ? { [n.id]: l } : {};
    };
    switch (s.kind) {
      case 'header': {
        // Project pages: the logo's second line names the project, in its theme colour (Zeyi, 2026-11-01).
        const hero = data.sections.find((x) => x.kind === 'hero')?.tree;
        const subtitle = hero && findNode(hero, (n) => n.kind === 'text' && n.name === 'Subtitle')?.text;
        const sub = `${data.number} · ${data.title}${subtitle ? ` — ${subtitle}` : ''}`.toUpperCase();
        header = <SiteHeader key={s.key} section={s.key} sub={sub} />;
        break;
      }
      case 'footer': {
        const text = (layer: string) => t.texts?.find((x) => x.layer === layer)?.text ?? '';
        footer = <SiteFooter key={s.key} section={s.key} left={text('Left')} right={text('Right')} />;
        break;
      }
      case 'film':
        out.push(<Film key={s.key} section={s} />);
        break;
      case 'breadcrumb':
        out.push(
          <Section
            key={s.key}
            section={s}
            as="nav"
            label="Breadcrumb"
            ctx={{ links: { ...link('Back to board', board(self)), ...link('Next', { href: nextHref }) } }}
          />,
        );
        break;
      case 'hero': {
        const title = findNode(t, (n) => n.name === 'Title' && n.textStyle === 'Pegboard/Case H1');
        out.push(<Section key={s.key} section={s} label={data.title} ctx={{ priority: true, tags: title ? { [title.id]: 'h1' } : {} }} />);
        break;
      }
      case 'tabs': {
        // Tab "01 CONTEXT & RESEARCH" → chapter 01's anchor.
        const anchors = new Map(data.sections.filter((x) => x.kind === 'chapter').map((x) => [x.number, `#${x.anchor}`]));
        const links: Record<string, CaseLink> = {};
        for (const tab of t.children?.flatMap((c) => c.children ?? []) ?? []) {
          const href = tab.component === 'Nav/Tab' && anchors.get(String(tab.props?.Label ?? '').slice(0, 2));
          if (href) links[tab.id] = { href };
        }
        out.push(
          <ChapterTabs key={s.key} top={tabsTop} label="Chapters" section={s.key}>
            <CaseNodeView node={t} root ctx={{ links }} />
          </ChapterTabs>,
        );
        break;
      }
      case 'chapter': {
        const title = findNode(t, (n) => n.name === 'Title' && n.textStyle === 'Pegboard/Case H2');
        // A "Button · …" frame holding a linked text (UB "Official site"): the whole button is the link, new tab.
        const links: Record<string, CaseLink> = {};
        const visit = (n: CaseNode) => {
          const href = n.name.startsWith('Button') ? findNode(n, (x) => !!x.link)?.link : undefined;
          if (href) links[n.id] = { href, external: true };
          else n.children?.forEach(visit);
        };
        visit(t);
        out.push(<Section key={s.key} section={s} scrollMargin={chapterMargin} ctx={{ links, ids: title ? { [title.id]: `${s.anchor}-title` } : {} }} />);
        break;
      }
      case 'next': {
        const card = findNode(t, (n) => n.component === 'Project Card');
        const [padTop, padRight] = t.layout?.padding ?? [0, 0];
        out.push(
          <Section
            key={s.key}
            section={s}
            label="Next tool on the board"
            ctx={{
              // "Back to top" sits in the gap above the card, on its right edge.
              extra: { [t.id]: <BackToTop style={{ position: 'absolute', right: padRight, top: padTop / 2, transform: 'translateY(-50%)' }} /> },
              links: {
                ...link('Take it off', { href: nextHref }),
                ...link('Back', board(next)),
                ...(card ? { [card.id]: { href: nextHref, label: next ? `${next.title} — ${next.detail.caseHref ? 'open the case' : 'open it on the board'}` : undefined } } : {}),
              },
            }}
          />,
        );
        break;
      }
    }
  }

  return (
    <div data-theme={data.modes.theme} className="min-h-screen" style={{ background: 'var(--surface-wall)', color: 'var(--text-primary)' }}>
      <CaseZoom frame={data.w} />
      <div className="mx-auto" style={{ maxWidth: data.w, zoom: 'var(--case-zoom, 1)' }}>
        {header}
        <main>{out}</main>
        {footer}
      </div>
    </div>
  );
}
