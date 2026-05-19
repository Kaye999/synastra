"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

type LineageFigure = {
  name: string;
  era: string;
  quote: string;
  attrib: string;
  body: string;
};

type Props = {
  figures: readonly LineageFigure[];
  /** Pixels to advance per frame at 60fps. ~0.35 ≈ 140s for a full cycle of 10 wide cards. */
  speed?: number;
  /** Milliseconds of user idleness before auto-scroll resumes. */
  resumeAfterMs?: number;
};

/**
 * Infinite marquee wheel you can also grab.
 *
 * - Auto-advances scrollLeft every animation frame.
 * - When the user scrolls/drags (wheel / touch / drag), a listener marks
 *   the component "interacting" and pauses the auto-scroll.
 * - After `resumeAfterMs` of idleness, auto-scroll resumes from the
 *   current scroll position.
 * - Content is duplicated so the wheel loops seamlessly — when the user
 *   (or the auto-scroller) reaches the midpoint, scrollLeft jumps back
 *   by that midpoint width without a visible seam.
 * - prefers-reduced-motion disables the auto-loop entirely but keeps
 *   manual scrolling.
 */
export default function LineageScroller({ figures, speed = 0.35, resumeAfterMs = 1800 }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastUserInteractionRef = useRef<number>(0);
  const reducedMotionRef = useRef(false);

  // Click-to-expand: which figure is open in the reader modal?
  const [openFigure, setOpenFigure] = useState<LineageFigure | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Esc closes the modal. Body scroll-lock while open.
  useEffect(() => {
    if (!openFigure) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenFigure(null);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [openFigure]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const onMqChange = () => {
      reducedMotionRef.current = mq.matches;
    };
    mq.addEventListener?.('change', onMqChange);

    let running = true;

    const step = () => {
      if (!running) return;
      const now = performance.now();
      const sinceInteraction = now - lastUserInteractionRef.current;
      const shouldAutoScroll =
        !reducedMotionRef.current && sinceInteraction > resumeAfterMs;

      if (shouldAutoScroll) {
        el.scrollLeft += speed;
      }

      // Seamless loop — when we're past the halfway point of the duplicated track,
      // jump silently back by half the scroll-width. This works because the content
      // is rendered twice: positions 0..N-1 and N..2N-1 are visually identical.
      const half = el.scrollWidth / 2;
      if (el.scrollLeft >= half) {
        // Use non-smooth instant jump (browser keeps it pixel-identical because content is duplicated)
        el.scrollLeft -= half;
      } else if (el.scrollLeft < 0) {
        el.scrollLeft += half;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    const markInteraction = () => {
      lastUserInteractionRef.current = performance.now();
    };

    // User interactions that should pause auto-scroll
    el.addEventListener('wheel', markInteraction, { passive: true });
    el.addEventListener('touchstart', markInteraction, { passive: true });
    el.addEventListener('touchmove', markInteraction, { passive: true });
    el.addEventListener('pointerdown', markInteraction);
    el.addEventListener('scroll', markInteraction, { passive: true });

    rafRef.current = requestAnimationFrame(step);

    return () => {
      running = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      mq.removeEventListener?.('change', onMqChange);
      el.removeEventListener('wheel', markInteraction);
      el.removeEventListener('touchstart', markInteraction);
      el.removeEventListener('touchmove', markInteraction);
      el.removeEventListener('pointerdown', markInteraction);
      el.removeEventListener('scroll', markInteraction);
    };
  }, [speed, resumeAfterMs]);

  // Render the list twice for seamless loop.
  const doubled: ReactNode[] = [];
  for (let copy = 0; copy < 2; copy++) {
    figures.forEach((figure, i) => {
      doubled.push(
        <button
          key={`${figure.name}-${copy}`}
          type="button"
          className="mk-lineage-card mk-lineage-card-button"
          data-index={i + 1}
          aria-hidden={copy === 1}
          aria-label={`Read more about ${figure.name}`}
          onClick={() => setOpenFigure(figure)}
        >
          <div className="mk-lineage-card-index">
            {String(i + 1).padStart(2, '0')} / {figures.length}
          </div>
          <div className="mk-lineage-card-name">{figure.name}</div>
          <div className="mk-lineage-card-era">{figure.era}</div>
          <blockquote className="mk-lineage-card-quote">{figure.quote}</blockquote>
          <div className="mk-lineage-card-attrib">— {figure.attrib}</div>
          <div className="mk-lineage-card-rule" />
          <p className="mk-lineage-card-body">{figure.body}</p>
          <span className="mk-lineage-card-readmore">Read more →</span>
        </button>
      );
    });
  }

  return (
    <>
      <div
        ref={scrollerRef}
        className="mk-lineage-scroller mk-lineage-scroller-js"
        tabIndex={0}
        role="region"
        aria-label="Lineage — drag or swipe to explore. Click a figure to read more."
      >
        <div className="mk-lineage-track mk-lineage-track-js">{doubled}</div>
      </div>

      {/* Click-to-expand reader modal */}
      {mounted && openFigure && createPortal(
        <div
          className="mk-lineage-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={openFigure.name}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenFigure(null);
          }}
        >
          <article className="mk-lineage-modal">
            <button
              type="button"
              className="mk-lineage-modal-close"
              aria-label="Close"
              onClick={() => setOpenFigure(null)}
            >
              ✕
            </button>
            <div className="mk-lineage-modal-name">{openFigure.name}</div>
            <div className="mk-lineage-modal-era">{openFigure.era}</div>
            <blockquote className="mk-lineage-modal-quote">{openFigure.quote}</blockquote>
            <div className="mk-lineage-modal-attrib">— {openFigure.attrib}</div>
            <div className="mk-lineage-modal-rule" />
            <p className="mk-lineage-modal-body">{openFigure.body}</p>
          </article>
        </div>,
        document.body,
      )}
    </>
  );
}
