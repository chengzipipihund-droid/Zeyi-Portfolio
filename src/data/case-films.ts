// Case-page films hosted on Vimeo (Zeyi, 2026-11-01), keyed by case slug. They replace the export's
// public/projects/<slug>/intro.mp4: the Figma frame stays the poster, the play button opens the Vimeo player over it.
export const caseFilms: Record<string, { vimeo: string }> = {
  'ultra-bridge': { vimeo: 'https://vimeo.com/1242032034' },
};

/** The embeddable player URL of a vimeo.com link (autoplays with sound once the visitor has pressed play). */
export function vimeoPlayer(url: string): string | undefined {
  const id = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
  return id ? `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0&dnt=1` : undefined;
}
