"use client";

// Reveal — tiny IntersectionObserver wrapper for staggered scroll-in
// animations on the marketing pages. Used by landing, pricing, and
// how-it-works. The _marketing folder (underscore) is a private app
// folder and is not routable.

import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  delay?: number;
  as?: 'div' | 'span' | 'section';
};

export default function Reveal({ children, delay = 0, as = 'div' }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0.1 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const style = { transitionDelay: visible ? `${delay}ms` : '0ms' };
  const className = `mk-reveal${visible ? ' is-visible' : ''}`;

  if (as === 'span') {
    return (
      <span
        ref={ref as React.RefObject<HTMLSpanElement>}
        className={className}
        style={style}
      >
        {children}
      </span>
    );
  }
  if (as === 'section') {
    return (
      <section
        ref={ref as React.RefObject<HTMLElement>}
        className={className}
        style={style}
      >
        {children}
      </section>
    );
  }
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}
