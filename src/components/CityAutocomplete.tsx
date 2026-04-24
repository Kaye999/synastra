"use client";

// CityAutocomplete — Nominatim-backed typeahead for the onboarding
// birth-place field. Returns both a display label ("Sydney, New South
// Wales, Australia") and a resolved coords object so the chart engines
// can use accurate lat/lon/tz without a post-hoc gazetteer match.
//
// Keyboard: ↑/↓ to move, Enter to pick, Esc to close.
// Click-outside closes too.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type CityHit = {
  label: string;
  city: string;
  region: string | null;
  country: string;
  lat: number;
  lon: number;
  tzOffset: number;
};

export type CityAutocompleteProps = {
  id?: string;
  value: string;
  onChange: (label: string) => void;
  onSelect: (hit: CityHit) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
};

const DEBOUNCE_MS = 350;
const MIN_CHARS = 2;

export default function CityAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  ariaLabel,
}: CityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<CityHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, {
        signal: ctrl.signal,
        cache: 'force-cache',
      });
      if (!res.ok) throw new Error(`geocode ${res.status}`);
      const { results } = (await res.json()) as { results: CityHit[] };
      setHits(Array.isArray(results) ? results : []);
      setActiveIdx(-1);
      setOpen(true);
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      setHits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced fetch on value change.
  useEffect(() => {
    const trimmed = value.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (trimmed.length < MIN_CHARS) {
      setHits([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(trimmed);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions]);

  // Click-outside to close the dropdown.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const pick = useCallback((hit: CityHit) => {
    onChange(hit.label);
    onSelect(hit);
    setOpen(false);
    setActiveIdx(-1);
  }, [onChange, onSelect]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || hits.length === 0) {
      if (e.key === 'ArrowDown' && value.trim().length >= MIN_CHARS) {
        void fetchSuggestions(value.trim());
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % hits.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? hits.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && activeIdx < hits.length) {
        e.preventDefault();
        pick(hits[activeIdx]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }, [open, hits, activeIdx, pick, value, fetchSuggestions]);

  const listboxId = useMemo(() => `${id || 'city'}-listbox`, [id]);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        id={id}
        className={className}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => {
          if (hits.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={
          activeIdx >= 0 ? `${listboxId}-opt-${activeIdx}` : undefined
        }
        autoComplete="off"
        spellCheck={false}
      />
      {open && (hits.length > 0 || loading) && (
        <ul
          id={listboxId}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 30,
            background: 'rgba(10, 14, 26, 0.96)',
            border: '1px solid rgba(200, 160, 82, 0.35)',
            borderRadius: 6,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 8px 28px rgba(0, 0, 0, 0.45)',
            listStyle: 'none',
            margin: 0,
            padding: 4,
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {loading && hits.length === 0 && (
            <li
              style={{
                padding: '10px 14px',
                color: 'var(--ink-dim)',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                letterSpacing: '0.12em',
              }}
            >
              searching…
            </li>
          )}
          {hits.map((h, i) => (
            <li
              key={`${h.label}-${h.lat}-${h.lon}`}
              id={`${listboxId}-opt-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={(e) => {
                // Prevent input blur before click lands.
                e.preventDefault();
                pick(h);
              }}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                fontFamily: "'Crimson Pro', serif",
                fontSize: 15,
                color: i === activeIdx ? 'var(--brass)' : 'var(--ink)',
                background: i === activeIdx ? 'rgba(200, 160, 82, 0.08)' : 'transparent',
                borderRadius: 4,
              }}
            >
              {h.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
