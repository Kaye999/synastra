import type { Weather, WeatherId } from './types';

// Open-Meteo: free, no API key, no auth. Generous rate limits.
// https://open-meteo.com/en/docs

// WMO weather codes → our coarse WeatherId.
// Full reference: https://open-meteo.com/en/docs (search "WMO Weather interpretation")
function codeToId(code: number): WeatherId {
  if (code === 0)                   return 'clear';
  if (code >= 1 && code <= 2)       return 'cloudy';
  if (code === 3)                   return 'overcast';
  if (code === 45 || code === 48)   return 'fog';
  if (code >= 51 && code <= 67)     return 'rain';
  if (code >= 71 && code <= 77)     return 'snow';
  if (code >= 80 && code <= 82)     return 'rain';
  if (code >= 85 && code <= 86)     return 'snow';
  if (code >= 95 && code <= 99)     return 'storm';
  return 'clear';
}

function labelFor(id: WeatherId, tempC: number): string {
  const t = `${Math.round(tempC)}°C`;
  switch (id) {
    case 'clear':    return `Clear · ${t}`;
    case 'cloudy':   return `Partly cloudy · ${t}`;
    case 'overcast': return `Overcast · ${t}`;
    case 'fog':      return `Fog · ${t}`;
    case 'rain':     return `Rain · ${t}`;
    case 'snow':     return `Snow · ${t}`;
    case 'storm':    return `Storm · ${t}`;
  }
}

export async function fetchWeather(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<Weather | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}` +
      `&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`;
    const res = await fetch(url, { signal, cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const code = data?.current?.weather_code;
    const tempC = data?.current?.temperature_2m;
    if (typeof code !== 'number' || typeof tempC !== 'number') return null;
    const id = codeToId(code);
    return { id, label: labelFor(id, tempC), tempC, source: 'open-meteo' };
  } catch {
    return null;
  }
}
