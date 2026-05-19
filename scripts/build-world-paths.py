#!/usr/bin/env python3
"""
One-off: decode world-atlas TopoJSON, project each country via
equirectangular into 1440×720, output a TypeScript file with SVG path
strings ready to embed in AstrocartoMap.

Equirectangular projection used by Synastra:
  x = (lon + 180) / 360 * MAP_W
  y = (90  - lat) / 180 * MAP_H
"""
import json
import sys

MAP_W = 1440
MAP_H = 720

with open('/tmp/countries-110m.topo.json') as f:
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

def polygon_to_path(rings):
    """rings: list of list of (lon, lat) — outer first, holes after."""
    parts = []
    for ring in rings:
        if not ring:
            continue
        d = []
        for i, (lon, lat) in enumerate(ring):
            x = (lon + 180) / 360 * MAP_W
            y = (90 - lat) / 180 * MAP_H
            # Equirectangular doesn't wrap; ignore points outside range.
            cmd = 'M' if i == 0 else 'L'
            d.append(f'{cmd}{x:.1f} {y:.1f}')
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
    rings = []
    if gtype == 'Polygon':
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
ts_lines = [
    '// Generated from world-atlas/countries-110m.json (Natural Earth, 1:110m).',
    '// One country per entry; `d` is the SVG path already projected via',
    '// equirectangular into the AstrocartoMap 1440×720 coordinate space.',
    '// DO NOT EDIT BY HAND — regenerate via scripts/build-world-paths if updated.',
    '',
    'export type CountryPath = { name: string; iso: string; d: string };',
    '',
    f'export const WORLD_COUNTRIES: readonly CountryPath[] = [',
]
for c in out:
    name = c['name'].replace("'", "\\'")
    ts_lines.append(f"  {{ name: '{name}', iso: '{c['iso']}', d: '{c['d']}' }},")
ts_lines.append('];')

print('\n'.join(ts_lines))
print(f'\n// {len(out)} countries', file=sys.stderr)
