'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { buildAmbientState } from './state';
import { fetchWeather } from './weather';
import type { AmbientState, Weather } from './types';

interface UseAmbientReturn {
  state: AmbientState;
  loadingLocation: boolean;
  requestLocation: () => void;
  setLocationManually: (loc: { name: string; lat: number; lng: number }) => void;
}

// Reverse-geocode a lat/lng to a place name via Nominatim (also used elsewhere in Synastra).
// Best-effort — falls back to coordinates if the lookup fails.
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const a = data?.address ?? {};
    const place = a.city || a.town || a.village || a.county || a.state || a.country;
    return place ? `${place}` : `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  } catch {
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  }
}

export function useAmbient(): UseAmbientReturn {
  const [location, setLocation] = useState<AmbientState['location']>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [tick, setTick] = useState(0);
  const weatherCtrlRef = useRef<AbortController | null>(null);

  // Recompute the date-driven slice every 60s — keeps time-of-day fresh without re-rendering on every paint.
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Refetch weather whenever location changes; refresh every 15 min.
  useEffect(() => {
    if (!location) return;
    weatherCtrlRef.current?.abort();
    const ctrl = new AbortController();
    weatherCtrlRef.current = ctrl;
    fetchWeather(location.lat, location.lng, ctrl.signal).then(setWeather);
    const id = window.setInterval(() => {
      fetchWeather(location.lat, location.lng).then(setWeather);
    }, 15 * 60_000);
    return () => {
      window.clearInterval(id);
      ctrl.abort();
    };
  }, [location]);

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) return;
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const name = await reverseGeocode(lat, lng);
        setLocation({ name, lat, lng });
        setLoadingLocation(false);
      },
      () => setLoadingLocation(false),
      { enableHighAccuracy: false, maximumAge: 600_000, timeout: 10_000 },
    );
  }, []);

  const setLocationManually = useCallback(
    (loc: { name: string; lat: number; lng: number }) => setLocation(loc),
    [],
  );

  const state = buildAmbientState({
    date: new Date(),
    location,
    weather,
  });

  // Reference `tick` so React keeps the dependency-tracking honest and recomputes when the clock advances.
  void tick;

  return { state, loadingLocation, requestLocation, setLocationManually };
}
