"use client";

// /today client shell — page chrome (Starfield, TraditionTopBar, identity
// cluster, SettingsCog, TransitAlerts) wrapped around the three daily/monthly
// tiles: DailyRitual, Morning Cup (open by default), The Arc.

import { useState } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import Starfield from '@/components/Starfield';
import TraditionTopBar from '@/components/TraditionTopBar';
import CollapsibleHero from '@/components/CollapsibleHero';
import DailyRitual from '@/components/DailyRitual';
import MorningCup from '@/components/MorningCup';
import MonthlyForecast from '@/components/MonthlyForecast';
import SettingsCog from '@/components/SettingsCog';
import TransitAlerts from '@/components/TransitAlerts';
import type { BirthData } from '@/lib/types';
import type { Tier } from '@/lib/tiers';

type Props = { user: BirthData; tier: Tier };

export default function TodayClient({ user, tier }: Props) {
  const [morningOpen, setMorningOpen] = useState(true);
  const [arcOpen, setArcOpen] = useState(false);

  const firstName = user.name || user.fullName.split(' ')[0] || 'You';

  const onReset = () => {
    if (typeof window !== 'undefined') {
      fetch('/api/profile', { method: 'DELETE' }).finally(() => {
        window.location.href = '/onboarding';
      });
    }
  };

  return (
    <div className="page mode-today" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Starfield />

      <TraditionTopBar tier={tier} />

      <div
        style={{
          position: 'fixed',
          top: 14,
          left: 14,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Link
          href="/"
          aria-label="Synastra home"
          className="dash-home-pill"
          style={{
            padding: '0 14px',
            height: 40,
            display: 'inline-flex',
            alignItems: 'center',
            fontFamily: "'Alice', serif",
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: '0.14em',
            color: 'var(--ink)',
            textDecoration: 'none',
            background: 'rgba(10, 14, 26, 0.72)',
            border: '1px solid rgba(252, 250, 246, 0.10)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 20,
          }}
        >
          <span className="dash-home-icon">←</span>
          <span className="dash-home-word">&nbsp;SYNASTRA</span>
        </Link>
        <UserButton appearance={{ elements: { avatarBox: { width: 36, height: 36 } } }} />
      </div>

      <SettingsCog user={user} onSave={() => {}} onReset={onReset} />
      <TransitAlerts user={user} firstName={firstName} tier={tier} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '150px 24px 120px' }}>
        <div className="reveal" style={{ animationDelay: '60ms' }}>
          <DailyRitual />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 32, marginBottom: 56 }}>
          <div className="reveal" style={{ animationDelay: '120ms' }}>
            <CollapsibleHero
              eyebrow={`TODAY · ${new Date()
                .toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long' })
                .toUpperCase()}`}
              title="Morning Cup"
              tease="What today's sky is saying to you."
              open={morningOpen}
              onToggle={() => setMorningOpen((v) => !v)}
            >
              <MorningCup user={user} firstName={firstName} />
            </CollapsibleHero>
          </div>
          <div className="reveal" style={{ animationDelay: '240ms' }}>
            <CollapsibleHero
              eyebrow={`${new Date()
                .toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
                .toUpperCase()} · THE ARC`}
              title="Twelve threads, one month"
              tease="Open each thread of the month."
              open={arcOpen}
              onToggle={() => setArcOpen((v) => !v)}
            >
              <MonthlyForecast user={user} firstName={firstName} />
            </CollapsibleHero>
          </div>
        </div>
      </div>
    </div>
  );
}
