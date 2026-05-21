"use client";

// CityAutocomplete — typeahead for the onboarding birth-place field, backed
// by /api/geocode (Open-Meteo). Returns a display label plus resolved
// coords + IANA timezone so the chart engines can compute without any
// post-hoc gazetteer lookup.
//
// The dropdown is rendered through a React portal anchored to <body> so it
// escapes the parent form's stacking context (animated `.onboard-field`
// siblings would otherwise paint over it — past overlap bug).
//
// Keyboard: ↑/↓ to move, Enter to pick, Esc to close.
// Click-outside closes too; the portal's own click region is excluded.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

export type CityHit = {
  label: string;
  city: string;
  region: string | null;
  country: string;
  lat: number;
  lon: number;
  /** Hours from UTC, derived from tzId at request time. */
  tzOffset: number;
  /** IANA timezone identifier, e.g. "Australia/Sydney". Authoritative. */
  tzId?: string;
  /** Population, used as a context subtitle in the dropdown row. */
  population?: number | null;
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

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

type Rect = { top: number; left: number; width: number };

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
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Portals need a DOM target. Wait for client mount.
  useEffect(() => {
    setMounted(true);
  }, []);

  const measure = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  // Re-measure whenever the dropdown is open and the viewport shifts.
  useLayoutEffect(() => {
    if (!open) return;
    measure();
    const onChange = () => measure();
    window.addEventListener('scroll', onChange, true);
    window.addEventListener('resize', onChange);
    return () => {
      window.removeEventListener('scroll', onChange, true);
      window.removeEventListener('resize', onChange);
    };
  }, [open, measure]);

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

  // Click-outside closes the dropdown. Both the input and the portaled
  // list count as "inside" — without checking the portal, clicking an
  // option would close before the click landed.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (inputRef.current?.contains(t)) return;
      if (listRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const pick = useCallback(
    (hit: CityHit) => {
      onChange(hit.label);
      onSelect(hit);
      setOpen(false);
      setActiveIdx(-1);
    },
    [onChange, onSelect],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    },
    [open, hits, activeIdx, pick, value, fetchSuggestions],
  );

  const listboxId = useMemo(() => `${id || 'city'}-listbox`, [id]);

  const dropdown =
    mounted && open && rect && (hits.length > 0 || loading) ? (
      <ul
        ref={listRef}
        id={listboxId}
        role="listbox"
        style={{
          position: 'fixed',
          top: rect.top,
          left: rect.left,
          width: rect.width,
          zIndex: 9999,
          background: '#0A0E1A',
          border: '1px solid rgba(200, 160, 82, 0.45)',
          borderRadius: 6,
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7)',
          listStyle: 'none',
          margin: 0,
          padding: 4,
          maxHeight: 320,
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
              fontFamily: "'Hanken Grotesk', serif",
              fontSize: 15,
              color: i === activeIdx ? 'var(--brass)' : 'var(--ink)',
              background:
                i === activeIdx ? 'rgba(200, 160, 82, 0.08)' : 'transparent',
              borderRadius: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 12,
            }}
          >
            <span>{h.label}</span>
            {h.tzId && (
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  color: 'var(--ink-faint, rgba(252,250,246,0.45))',
                  whiteSpace: 'nowrap',
                }}
              >
                {h.tzId}
              </span>
            )}
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <>
      <input
        ref={inputRef}
        id={id}
        className={className}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => {
          if (hits.length > 0) {
            measure();
            setOpen(true);
          }
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
      {dropdown && createPortal(dropdown, document.body)}
    </>
  );
}
