#!/usr/bin/env python3
"""
One-off: decode world-atlas TopoJSON, project each country and output a
TypeScript file with SVG path strings ready to embed in AstrocartoMap.

Two projections supported via --projection {equirect,azimuthal}:

  equirectangular (Classic):
    x = (lon + 180) / 360 * MAP_W      ; MAP_W = 1440
    y = (90  - lat) / 180 * MAP_H      ; MAP_H = 720

  azimuthal-equidistant (Flat Earth, centred on North Pole):
    R = MAP_SIZE / 2   (= 450 for 900×900 viewBox; ρ goes 0..R for the
                       full hemisphere, then 0..2R covers down to south pole)
    Concretely:
      ρ = (90 - lat) * (R_FULL / 180)   with R_FULL = 360
      θ = lon * π/180
      x = CENTER_X + ρ * sin(θ)
      y = CENTER_Y - ρ * cos(θ)        (north pole is up)

Usage:
    python3 scripts/build-world-paths.py                       # equirect → world-countries.ts
    python3 scripts/build-world-paths.py --projection azimuthal  # → world-countries-flat.ts
"""
import argparse
import json
import math
import sys

# ── Equirectangular constants (Classic view) ────────────────────────────────
MAP_W = 1440
MAP_H = 720

# ── Azimuthal constants (Flat Earth view) ──────────────────────────────────
# Square viewBox 900×900 with the north pole at the centre. R_FULL is the
# pixel radius assigned to the south pole. CENTER_{X,Y} = MAP_SIZE/2.
AZ_SIZE = 900
AZ_CENTER_X = AZ_SIZE / 2
AZ_CENTER_Y = AZ_SIZE / 2
AZ_R_FULL = 360  # south pole sits this far from centre (matches docstring)


def project_equirect(lon: float, lat: float) -> tuple[float, float]:
    x = (lon + 180) / 360 * MAP_W
    y = (90 - lat) / 180 * MAP_H
    return x, y


def project_azimuthal(lon: float, lat: float) -> tuple[float, float]:
    rho = (90 - lat) * (AZ_R_FULL / 90)  # 0 at NP, 360 at SP (one full radius
                                          # per hemisphere — south pole sits
                                          # on the outer rim of the disc).
    theta = lon * math.pi / 180
    x = AZ_CENTER_X + rho * math.sin(theta)
    y = AZ_CENTER_Y - rho * math.cos(theta)
    return x, y


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--projection',
        choices=['equirect', 'azimuthal'],
        default='equirect',
    )
    parser.add_argument(
        '--topo',
        default='/tmp/countries-110m.topo.json',
    )
    args = parser.parse_args()

    with open(args.topo) as f:
        topo = json.load(f)

    transform = topo.get('transform', {})
    sx, sy = transform.get('scale', [1, 1])
    tx, ty = transform.get('translate', [0, 0])

    # Decode each arc to a list of absolute lon/lat points.
    arcs = []
    for raw_arc in topo['arcs']:
        pts = []
        cx, cy = 0, 0
        for dx, dy in raw_arc:
            cx += dx
            cy += dy
            lon = cx * sx + tx
            lat = cy * sy + ty
            pts.append((lon, lat))
        arcs.append(pts)

    def ring_points(ring_arc_indices):
        """Stitch arcs into a single ring (handles reverse via ~i)."""
        points = []
        for i in ring_arc_indices:
            if i >= 0:
                arc = arcs[i]
            else:
                arc = list(reversed(arcs[~i]))
            if points and arc and points[-1] == arc[0]:
                points.extend(arc[1:])
            else:
                points.extend(arc)
        return points

    project = (
        project_equirect if args.projection == 'equirect' else project_azimuthal
    )

    def polygon_to_path(rings):
        """rings: list of list of (lon, lat) — outer first, holes after.

        For the azimuthal projection we densify each segment so that long
        spans (e.g. Antarctica's coastline) curve correctly around the disc
        instead of jumping in straight chords across the rim.
        """
        parts = []
        for ring in rings:
            if not ring:
                continue
            d = []
            prev_lon = None
            prev_lat = None
            for i, (lon, lat) in enumerate(ring):
                if i == 0:
                    x, y = project(lon, lat)
                    d.append(f'M{x:.1f} {y:.1f}')
                else:
                    # Densify in lon/lat space when the gap is large — keeps
                    # straight equirect segments straight, while letting the
                    # azimuthal projection curve gracefully.
                    dlon = lon - prev_lon
                    # wrap-aware delta (-180..180)
                    while dlon > 180:
                        dlon -= 360
                    while dlon < -180:
                        dlon += 360
                    dlat = lat - prev_lat
                    span = max(abs(dlon), abs(dlat))
                    if args.projection == 'azimuthal' and span > 2:
                        steps = min(int(math.ceil(span / 2)), 32)
                        for s in range(1, steps + 1):
                            t = s / steps
                            ilon = prev_lon + dlon * t
                            ilat = prev_lat + dlat * t
                            x, y = project(ilon, ilat)
                            d.append(f'L{x:.1f} {y:.1f}')
                    else:
                        x, y = project(lon, lat)
                        d.append(f'L{x:.1f} {y:.1f}')
                prev_lon = lon
                prev_lat = lat
            d.append('Z')
            parts.append(''.join(d))
        return ' '.join(parts)

    # Process countries.
    countries_obj = topo['objects']['countries']
    out = []
    for geom in countries_obj['geometries']:
        name = geom.get('properties', {}).get('name', '')
        iso = geom.get('id', '')
        gtype = geom['type']
        if gtype == 'Polygon':
            rings = []
            for ring_arcs in geom['arcs']:
                rings.append(ring_points(ring_arcs))
            path = polygon_to_path(rings)
        elif gtype == 'MultiPolygon':
            all_paths = []
            for poly_arcs in geom['arcs']:
                poly_rings = [ring_points(ra) for ra in poly_arcs]
                all_paths.append(polygon_to_path(poly_rings))
            path = ' '.join(all_paths)
        else:
            continue
        out.append({'name': name, 'iso': iso, 'd': path})

    # Emit TS file.
    if args.projection == 'equirect':
        header = [
            '// Generated from world-atlas/countries-110m.json (Natural Earth, 1:110m).',
            '// One country per entry; `d` is the SVG path already projected via',
            '// equirectangular into the AstrocartoMap 1440×720 coordinate space.',
            '// DO NOT EDIT BY HAND — regenerate via scripts/build-world-paths.py.',
        ]
    else:
        header = [
            '// Generated from world-atlas/countries-110m.json (Natural Earth, 1:110m).',
            '// One country per entry; `d` is the SVG path already projected via',
            '// azimuthal-equidistant (Flat Earth) from the North Pole into a',
            '// 900×900 coordinate space. South Pole = outer rim.',
            '// DO NOT EDIT BY HAND — regenerate via:',
            '//   python3 scripts/build-world-paths.py --projection azimuthal',
        ]

    ts_lines = [
        *header,
        '',
        'export type CountryPath = { name: string; iso: string; d: string };',
        '',
        'export const WORLD_COUNTRIES: readonly CountryPath[] = [',
    ]
    for c in out:
        name = c['name'].replace("'", "\\'")
        ts_lines.append(f"  {{ name: '{name}', iso: '{c['iso']}', d: '{c['d']}' }},")
    ts_lines.append('];')

    print('\n'.join(ts_lines))
    print(f'\n// {len(out)} countries', file=sys.stderr)


if __name__ == '__main__':
    main()
