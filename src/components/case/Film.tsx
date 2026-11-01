'use client';

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';

// Ultra Bridge intro film (docs/case-pages-brief.md §5.2). The poster is the Figma frame's image; the video
// (public/projects/ultra-bridge/intro.mp4, TODO(zeyi)) plays over it when the file exists. Scroll scenes come in Part C.

type FilmState = { video: RefObject<HTMLVideoElement>; playing: boolean; toggle: () => void };
const FilmContext = createContext<FilmState | null>(null);

const staticMode = () =>
  typeof window !== 'undefined' && (window.matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('visual'));

export function FilmStage({ children, ...rest }: { children: ReactNode } & React.HTMLAttributes<HTMLElement>) {
  const video = useRef<HTMLVideoElement>(null);
  const root = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(false);
  const wanted = useRef(true); // the visitor's choice; off-screen pauses never overwrite it

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (staticMode()) wanted.current = false;
    const sync = () => setPlaying(!v.paused);
    v.addEventListener('play', sync);
    v.addEventListener('pause', sync);
    // Play only while the film is on screen.
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && wanted.current) v.play().catch(() => {});
      else v.pause();
    });
    if (root.current) io.observe(root.current);
    return () => {
      io.disconnect();
      v.removeEventListener('play', sync);
      v.removeEventListener('pause', sync);
    };
  }, []);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    wanted.current = v.paused;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  return (
    <FilmContext.Provider value={{ video, playing, toggle }}>
      <section ref={root} data-playing={playing || undefined} {...rest}>
        {children}
      </section>
    </FilmContext.Provider>
  );
}

export function FilmVideo({ src, poster }: { src: string; poster: string }) {
  const ctx = useContext(FilmContext)!;
  return (
    <video
      ref={ctx.video}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}

/** The circle of the film: a real play/pause button over the drawn circle (the play icon hides while playing). */
export function FilmButton({ style }: { style: CSSProperties }) {
  const { playing, toggle } = useContext(FilmContext)!;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? 'Pause the project film' : 'Play the project film'}
      className="cursor-pointer rounded-full border-0 bg-transparent p-0 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-theme-on-accent"
      style={{ ...style, zIndex: 2 }}
    >
      {playing && (
        <span aria-hidden className="absolute inset-0 flex items-center justify-center gap-[10px]">
          <span className="h-[34px] w-[9px] rounded-[2px] bg-theme-on-accent" />
          <span className="h-[34px] w-[9px] rounded-[2px] bg-theme-on-accent" />
        </span>
      )}
    </button>
  );
}
