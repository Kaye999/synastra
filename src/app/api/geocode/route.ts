// /api/geocode?q=sydney → proxies Open-Meteo's geocoding API and returns a
// simplified result list for the onboarding city autocomplete.
//
// Open-Meteo is free, no API key, worldwide (~12k populated places ranked
// by population), and crucially returns **real IANA timezones** like
// "Australia/Sydney" — not a longitude-derived approximation. Accurate tz
// is non-negotiable for chart computation (China spans 60° longitude but
// is all UTC+8; India is UTC+5:30, etc.).
//
// Endpoint: https://open-meteo.com/en/docs/geocoding-api
//
// Response shape:
//   { results: Array<{
//       label: "Sydney, New South Wales, Australia",
//       city: "Sydney",
//       region: "New South Wales",
//       country: "Australia",
//       lat: -33.868,
//       lon: 151.207,
//       tzId: "Australia/Sydney",   // IANA — authoritative
//       tzOffset: 10                  // hours from UTC at "now"; kept for
//                                     // backward compat with chart engines
//                                     // that haven't migrated to tzId yet
//     }>
//   }

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
// Edge cache on Vercel: 24h per-query. Low churn, low cost.
export const revalidate = 86400;

type OpenMeteoHit = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  country?: string;
  country_id?: number;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  admin4?: string;
  timezone?: string;
  population?: number;
};

type OpenMeteoResponse = {
  results?: OpenMeteoHit[];
  generationtime_ms?: number;
};

// Resolve current UTC offset (hours) for an IANA timezone. The chart engines
// that consume tzOffset still apply per-birthdate DST themselves; this is
// the seed value used when a consumer hasn't migrated to tzId yet.
function offsetHoursFromIana(tz: string): number {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    });
    const tzName =
      dtf.formatToParts(new Date()).find((p) => p.type === 'timeZoneName')
        ?.value || '';
    // e.g. "GMT+10", "GMT+5:30", "GMT-3:30", "GMT"
    const m = tzName.match(/GMT([+-]?)(\d{1,2})(?::(\d{2}))?/);
    if (!m) return 0;
    const sign = m[1] === '-' ? -1 : 1;
    const h = parseInt(m[2], 10);
    const min = m[3] ? parseInt(m[3], 10) : 0;
    return sign * (h + min / 60);
  } catch {
    return 0;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const upstream = new URL('https://geocoding-api.open-meteo.com/v1/search');
  upstream.searchParams.set('name', q);
  upstream.searchParams.set('count', '8');
  upstream.searchParams.set('language', 'en');
  upstream.searchParams.set('format', 'json');

  let data: OpenMeteoResponse;
  try {
    const res = await fetch(upstream.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { results: [], error: `upstream-${res.status}` },
        { status: 502 },
      );
    }
    data = (await res.json()) as OpenMeteoResponse;
  } catch (e) {
    return NextResponse.json(
      {
        results: [],
        error: 'upstream-failed',
        detail: e instanceof Error ? e.message : 'unknown',
      },
      { status: 502 },
    );
  }

  const results = (data.results || [])
    .map((h) => {
      const city = h.name;
      const country = h.country || '';
      if (!city || !country) return null;
      const lat = h.latitude;
      const lon = h.longitude;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      const region = h.admin1 || h.admin2 || null;
      const label =
        region && region !== city
          ? `${city}, ${region}, ${country}`
          : `${city}, ${country}`;
      const tzId = h.timezone || 'UTC';
      return {
        label,
        city,
        region,
        country,
        lat: Math.round(lat * 1000) / 1000,
        lon: Math.round(lon * 1000) / 1000,
        tzId,
        tzOffset: offsetHoursFromIana(tzId),
        population: h.population ?? null,
      };
    })
    .filter(<T,>(x: T | null): x is T => x !== null);

  return NextResponse.json(
    { results },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
      },
    },
  );
}
