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
        <span>Settings</span>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(6, 9, 18, 0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 540 }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 2,
                background: 'transparent',
                border: 0,
                color: 'var(--ink, #FCFAF6)',
                fontSize: 22,
                cursor: 'pointer',
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
