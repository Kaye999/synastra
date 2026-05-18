# Ambient Scenes

Each scene is identified by a stable `id` (e.g. `autumn-day`) and consists of:

- **`<id>.jpg`** — required. The poster, shown immediately on first paint and as a fallback for users with `prefers-reduced-motion: reduce`.
- **`<id>.mp4`** — optional. The looping video. ~10–20 seconds, seamless loop, ~1080p, h.264.
- **`<id>.webm`** — optional. WebM/AV1 alternate for browsers that prefer it.

The placeholder posters in this folder are procedurally generated atmospheric gradients — adequate as a working preview, not finished art. Re-run `python3 scripts/generate-scene-posters.py` to regenerate.

## Adding a real scene

1. Find a CC0 / royalty-free nature loop (Pexels Videos, Coverr, Mixkit, Pixabay).
2. Trim to ~12 seconds, ensure seamless loop (last frame ≈ first frame).
3. Compress: `ffmpeg -i source.mp4 -t 12 -vf scale=1920:-2 -c:v libx264 -crf 24 -preset slow -an public/scenes/<id>.mp4`
4. Optional WebM: `ffmpeg -i public/scenes/<id>.mp4 -c:v libvpx-vp9 -crf 32 -b:v 0 -an public/scenes/<id>.webm`
5. Capture a poster at the loop midpoint: `ffmpeg -ss 6 -i public/scenes/<id>.mp4 -frames:v 1 -q:v 3 public/scenes/<id>.jpg`

The manifest in `src/lib/ambient/scenes.ts` already references `<id>.mp4`, `<id>.webm`, and `<id>.jpg` for every scene, so dropping new files in is enough — no code changes needed.

## Adding a new scene id

Append an entry to `SCENE_MANIFEST` in `src/lib/ambient/scenes.ts`. The resolver scores by specificity, so more conditions = higher priority. Order in the array only matters for tie-breaking.

## Current scene set

| ID | When it shows |
|---|---|
| `autumn-day` | Autumn, daylight |
| `autumn-dusk` | Autumn, dusk/twilight |
| `summer-day-clear` | Summer, daylight, clear weather |
| `summer-day` | Summer, daylight (any weather) |
| `spring-day` | Spring, daylight |
| `winter-frost-aus` | Winter, daylight, southern hemisphere |
| `winter-day` | Winter, daylight (any hemisphere) |
| `night-clear-fullmoon` | Any night with full moon |
| `night-clear-dark` | Night, new/crescent moon |
| `night-cloudy` | Night, cloudy/overcast |
| `night-generic` | Any night (fallback) |
| `dawn-generic` | Any dawn |
| `dusk-generic` | Any dusk (when no season-specific dusk matches) |
| `day-generic` | Any daylight (final fallback — should rarely fire) |
