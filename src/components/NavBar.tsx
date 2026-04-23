"use client";

// NavBar — floating browser-style nav (back / forward / refresh).
// Synastra runs inside a Chrome app-mode window that strips the URL bar,
// so pages need an in-page control. Ported from /Users/kaye/Projects/agenticOS/_navbar.js.
//
// Design tweaks for Synastra:
// - Active state uses --brass (#C8A052) instead of orange, matching DESIGN.md.
// - Idle icon tint stays warm-cream (--ink at reduced alpha), not neutral white.
// - Hover lifts to --ink (#FCFAF6), never pure white.
//
// Keyboard: ⌘[ / ⌘] (back / forward). ⌘R is left to the browser.

import { useEffect } from 'react';

const BACK_PATH = 'M15 18l-6-6 6-6';
const FORWARD_PATH = 'M9 18l6-6-6-6';
const REFRESH_PATH = 'M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5';

function NavIcon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export default function NavBar() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === '[') {
        e.preventDefault();
        window.history.back();
      } else if (e.key === ']') {
        e.preventDefault();
        window.history.forward();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <style>{`
        .syn-nav {
          position: fixed;
          top: 14px;
          left: 14px;
          z-index: 9999;
          display: flex;
          gap: 2px;
          padding: 4px;
          border-radius: 999px;
          background: rgba(10, 14, 26, 0.72);
          border: 1px solid rgba(252, 250, 246, 0.10);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
          font-family: 'IBM Plex Mono', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .syn-nav button {
          all: unset;
          cursor: pointer;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: rgba(252, 250, 246, 0.55);
          transition: background 0.15s ease, color 0.15s ease;
          font-size: 15px;
          line-height: 1;
        }
        .syn-nav button:hover:not([disabled]) {
          background: rgba(252, 250, 246, 0.08);
          color: #FCFAF6;
        }
        .syn-nav button:active:not([disabled]) {
          background: rgba(200, 160, 82, 0.22);
          color: #C8A052;
        }
        .syn-nav button:focus-visible {
          outline: 2px solid #C8A052;
          outline-offset: 2px;
        }
        .syn-nav button[disabled] {
          opacity: 0.28;
          cursor: not-allowed;
        }
        .syn-nav .sep {
          width: 1px;
          align-self: stretch;
          margin: 6px 2px;
          background: rgba(252, 250, 246, 0.08);
        }
        @media print { .syn-nav { display: none; } }
        @media (prefers-reduced-motion: reduce) {
          .syn-nav button { transition: none; }
        }
      `}</style>
      <div className="syn-nav" role="toolbar" aria-label="Page navigation">
        <button
          type="button"
          title="Back (⌘[)"
          aria-label="Back"
          onClick={() => window.history.back()}
        >
          <NavIcon d={BACK_PATH} />
        </button>
        <button
          type="button"
          title="Forward (⌘])"
          aria-label="Forward"
          onClick={() => window.history.forward()}
        >
          <NavIcon d={FORWARD_PATH} />
        </button>
        <div className="sep" aria-hidden="true" />
        <button
          type="button"
          title="Refresh"
          aria-label="Refresh"
          onClick={() => window.location.reload()}
        >
          <NavIcon d={REFRESH_PATH} />
        </button>
      </div>
    </>
  );
}
