"use client";

// SettingsCog — gear icon top-right that opens onboarding modal to edit birth data.
// Uses the same <Onboarding> form with `initial` pre-filled.

import { useState } from 'react';
import Onboarding from './Onboarding';
import type { BirthData } from '@/lib/types';

export type SettingsCogProps = {
  user: BirthData;
  onSave: (user: BirthData) => void;
  onReset: () => void;
};

export default function SettingsCog({ user, onSave, onReset }: SettingsCogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Settings"
        className="synastra-topnav-btn"
        style={{
          position: 'fixed',
          top: 18,
          right: 18,
          zIndex: 40,
          background: 'rgba(200, 160, 82, 0.12)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1.5px solid rgba(200, 160, 82, 0.55)',
          color: 'var(--brass, #C8A052)',
          height: 40,
          padding: '0 16px',
          borderRadius: 20,
          cursor: 'pointer',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 2px 12px rgba(200, 160, 82, 0.18)',
          transition: 'all 0.18s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(200, 160, 82, 0.22)';
          e.currentTarget.style.borderColor = 'rgba(200, 160, 82, 0.85)';
          e.currentTarget.style.boxShadow = '0 2px 18px rgba(200, 160, 82, 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(200, 160, 82, 0.12)';
          e.currentTarget.style.borderColor = 'rgba(200, 160, 82, 0.55)';
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(200, 160, 82, 0.18)';
        }}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>⚙</span>
        <span className="dash-corner-label">Settings</span>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(6, 9, 18, 0.82)',
            // Allow the modal to scroll on narrow viewports by putting
            // the flex + padding on the scroll container itself.
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            display: 'flex',
            alignItems: 'flex-start',       // anchor to top so long content starts at top, not clipped upward
            justifyContent: 'center',
            padding: '24px 24px 48px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 540,
              // Modal breathes rather than being forced to fit viewport —
              // parent overlay handles the scroll.
              margin: '24px auto',
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                position: 'sticky',          // stays reachable while scrolling the modal
                top: 8,
                float: 'right',
                marginRight: 8,
                zIndex: 2,
                background: 'rgba(10, 14, 26, 0.85)',
                border: '1px solid rgba(252,250,246,0.18)',
                width: 36,
                height: 36,
                borderRadius: '50%',
                color: 'var(--ink, #FCFAF6)',
                fontSize: 20,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              ×
            </button>
            <Onboarding
              initial={user}
              onSave={(u) => {
                onSave(u);
                setOpen(false);
              }}
            />
            <div style={{ textAlign: 'center', marginTop: -12, paddingBottom: 12 }}>
              <button
                type="button"
                className="onboard-demo"
                onClick={onReset}
                style={{ maxWidth: 320, margin: '0 auto' }}
              >
                Clear saved data &amp; start over
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
