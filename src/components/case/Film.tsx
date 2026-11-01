'use client';

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';

// Ultra Bridge intro film (docs/case-pages-brief.md §5.2). The poster is the Figma frame's image; the film lives on
// Vimeo (src/data/case-films.ts). Nothing third-party loads until the visitor presses play: then the Vimeo player
// covers the frame and starts with sound. Scrolling it off screen pauses it. Scroll scenes come in Part C.

type FilmState = { player: RefObject<HTMLIFrameElement>; open: boolean; play: () => void };
const FilmContext = createContext<FilmState | null>(null);

export function FilmStage({ children, ...rest }: { children: ReactNode } & React.HTMLAttributes<HTMLElement>) {
  const player = useRef<HTMLIFrameElement>(null);
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Vimeo's postMessage API: pause when the film leaves the screen (the visitor resumes it in the player).
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) player.current?.contentWindow?.postMessage(JSON.stringify({ method: 'pause' }), 'https://player.vimeo.com');
    });
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, [open]);

  return (
    <FilmContext.Provider value={{ player, open, play: () => setOpen(true) }}>
      <section ref={root} data-playing={open || undefined} {...rest}>
        {children}
      </section>
    </FilmContext.Provider>
  );
}

/** The Vimeo player over the whole frame, mounted once the visitor has pressed play. */
export function FilmPlayer({ src, title }: { src: string; title: string }) {
  const { player, open } = useContext(FilmContext)!;
  if (!open) return null;
  return (
    <iframe
      ref={player}
      src={src}
      title={title}
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      onLoad={(e) => e.currentTarget.focus()}
      className="border-0 bg-black"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 3 }}
    />
  );
}

/** The circle of the film: a real play button over the drawn circle. */
export function FilmButton({ style }: { style: CSSProperties }) {
  const { open, play } = useContext(FilmContext)!;
  if (open) return null;
  return (
    <button
      type="button"
      onClick={play}
      aria-label="Play the project film"
      className="cursor-pointer rounded-full border-0 bg-transparent p-0 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-theme-on-accent"
      style={{ ...style, zIndex: 2 }}
    />
  );
}
