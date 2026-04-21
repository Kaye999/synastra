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
        style={{
          position: 'fixed',
          top: 18,
          right: 18,
          zIndex: 40,
          background: 'transparent',
          border: '1px solid var(--rule, rgba(252,250,246,0.08))',
          color: 'var(--brass, #C8A052)',
          width: 36,
          height: 36,
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: 16,
        }}
      >
        ⚙
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
