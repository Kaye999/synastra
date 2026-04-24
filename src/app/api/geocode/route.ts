// /api/geocode?q=sydney → proxies OpenStreetMap Nominatim and returns a
// simplified result list for the onboarding city autocomplete.
//
// Nominatim is free + global (200+ countries), no API key required. Terms:
//   - max 1 req/sec per IP (debounced client-side + our short memory cache
//     keeps us well under)
//   - User-Agent required; we send a contact address
//   - We cache successful responses on Vercel for 24h to cut repeat calls
//
// Response shape:
//   { results: Array<{
//       label: "Sydney, New South Wales, Australia",
//       city: "Sydney",
//       region: "New South Wales",
//       country: "Australia",
//       lat: -33.87,
//       lon: 151.21,
//       tzOffset: 10   // rough: Math.round(lon / 15); refine post-launch
//     }>
//   }

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
// Edge cache on Vercel: 24h per-query. Low churn, low cost.
export const revalidate = 86400;

type NominatimHit = {
  lat: string;
  lon: string;
  display_name?: string;
  type?: string;
  class?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    suburb?: string;
    state?: string;
    state_district?: string;
    county?: string;
    country?: string;
  };
};

function roughTzOffset(lon: number): number {
  // Longitude → approximate hours offset from UTC. Good enough for a first-
  // pass chart computation; a proper IANA lookup can replace this later.
  const raw = Math.round(lon / 15);
  if (raw < -12) return raw + 24;
  if (raw > 14) return raw - 24;
  return raw;
}

function pickCityName(h: NominatimHit): string | null {
  const a = h.address;
  if (!a) return null;
  return a.city || a.town || a.village || a.hamlet || a.suburb || null;
}

function pickRegion(h: NominatimHit): string | null {
  const a = h.address;
  if (!a) return null;
  return a.state || a.state_district || a.county || null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const upstream = new URL('https://nominatim.openstreetmap.org/search');
  upstream.searchParams.set('q', q);
  upstream.searchParams.set('format', 'json');
  upstream.searchParams.set('addressdetails', '1');
  upstream.searchParams.set('limit', '6');
  // Focus on populated places so we don't surface random roads/POIs.
  upstream.searchParams.set('featuretype', 'city');

  let data: NominatimHit[];
  try {
    const res = await fetch(upstream.toString(), {
      headers: {
        // Nominatim ToS requires identifying UA with contact info.
        'User-Agent': 'Synastra/1.0 (hello@getsynastra.com)',
        'Accept-Language': 'en',
      },
      // Rely on Vercel's edge-cache for upstream results.
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json({ results: [], error: `upstream-${res.status}` }, { status: 502 });
    }
    data = (await res.json()) as NominatimHit[];
  } catch (e) {
    return NextResponse.json(
      { results: [], error: 'upstream-failed', detail: e instanceof Error ? e.message : 'unknown' },
      { status: 502 },
    );
  }

  const results = (Array.isArray(data) ? data : [])
    .map((h) => {
      const city = pickCityName(h);
      const country = h.address?.country || null;
      if (!city || !country) return null;
      const lat = Number(h.lat);
      const lon = Number(h.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      const region = pickRegion(h);
      const label = region && region !== city
        ? `${city}, ${region}, ${country}`
        : `${city}, ${country}`;
      return {
        label,
        city,
        region,
        country,
        lat: Math.round(lat * 1000) / 1000,
        lon: Math.round(lon * 1000) / 1000,
        tzOffset: roughTzOffset(lon),
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
