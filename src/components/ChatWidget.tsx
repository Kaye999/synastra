"use client";

// ChatWidget — placeholder. Another agent wires the real streaming AI chat,
// which will POST to /api/chat. This stub just renders a floating CTA so the
// dashboard layout is complete.

import { useState } from 'react';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 50,
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {open ? (
        <div
          style={{
            width: 320,
            height: 420,
            background: 'var(--bg-raise, #131828)',
            border: '1px solid var(--rule, rgba(252,250,246,0.08))',
            padding: 16,
            color: 'var(--ink, #FCFAF6)',
            fontSize: 13,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: 10, color: 'var(--brass, #C8A052)' }}>
              Atlas · chat
            </span>
            <button type="button" onClick={() => setOpen(false)} style={{ background: 'transparent', border: 0, color: 'inherit', cursor: 'pointer' }}>
              ×
            </button>
          </div>
          <p style={{ opacity: 0.6, fontSize: 12 }}>
            Chat is wired by a follow-up agent. This stub preserves the dashboard layout.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            border: '1px solid var(--brass, #C8A052)',
            color: 'var(--brass, #C8A052)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Ask the Atlas
        </button>
      )}
    </div>
  );
}
