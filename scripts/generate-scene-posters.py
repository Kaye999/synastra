#!/usr/bin/env python3
"""Generate atmospheric placeholder posters for the ambient scene library.

Each poster is a layered gradient + subtle noise + (where appropriate) celestial element.
Posters are immediate visuals — drop real video loops alongside them in /public/scenes/
and the manifest will pick them up automatically.

Run:  python3 scripts/generate-scene-posters.py
Output:  public/scenes/<scene-id>.jpg
"""
from __future__ import annotations

import math
import os
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "scenes"
OUT_DIR.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080


def vertical_gradient(stops: list[tuple[float, tuple[int, int, int]]]) -> np.ndarray:
    """stops: [(0..1, (r,g,b)), ...] sorted ascending. Returns (H,W,3) uint8."""
    stops = sorted(stops, key=lambda s: s[0])
    img = np.zeros((H, W, 3), dtype=np.float32)
    for y in range(H):
        t = y / (H - 1)
        for i in range(len(stops) - 1):
            t0, c0 = stops[i]
            t1, c1 = stops[i + 1]
            if t0 <= t <= t1:
                k = (t - t0) / max(t1 - t0, 1e-9)
                c = (1 - k) * np.array(c0) + k * np.array(c1)
                img[y, :, :] = c
                break
        else:
            img[y, :, :] = np.array(stops[-1][1])
    return img


def add_noise(img: np.ndarray, amount: float = 6.0) -> np.ndarray:
    rng = np.random.default_rng(seed=42)
    noise = rng.normal(0, amount, img.shape)
    return img + noise


def add_horizontal_haze(img: np.ndarray, y_center: float, width_frac: float, intensity: float, color: tuple[int, int, int]) -> np.ndarray:
    yy = np.arange(H).reshape(-1, 1)
    band = np.exp(-((yy - y_center) ** 2) / (2 * (H * width_frac) ** 2))
    band = np.repeat(band, W, axis=1)
    layer = np.zeros_like(img)
    for c in range(3):
        layer[..., c] = color[c]
    return img + band[..., None] * intensity * (layer - img) / 255.0 * 255.0


def add_disc(img: Image.Image, x: int, y: int, radius: int, color: tuple[int, int, int], glow: bool = True) -> Image.Image:
    """Draw a soft moon/sun disc with halo."""
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    if glow:
        for r, alpha in [(radius * 4, 18), (radius * 3, 30), (radius * 2, 60)]:
            draw.ellipse(
                (x - r, y - r, x + r, y + r),
                fill=(*color, alpha),
            )
    draw.ellipse(
        (x - radius, y - radius, x + radius, y + radius),
        fill=(*color, 255),
    )
    blurred = overlay.filter(ImageFilter.GaussianBlur(radius=4))
    return Image.alpha_composite(img.convert("RGBA"), blurred).convert("RGB")


def add_stars(img: Image.Image, density: float = 0.0008, brightness: int = 220) -> Image.Image:
    rng = random.Random(7)
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    n = int(W * H * density)
    for _ in range(n):
        x = rng.randint(0, W - 1)
        y = rng.randint(0, int(H * 0.65))   # only in sky region
        b = rng.randint(brightness - 60, brightness)
        size = rng.choice([1, 1, 1, 2])
        draw.ellipse((x, y, x + size, y + size), fill=(b, b, b, 220))
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def save(arr_or_img, name: str) -> None:
    if isinstance(arr_or_img, np.ndarray):
        arr = np.clip(arr_or_img, 0, 255).astype(np.uint8)
        img = Image.fromarray(arr)
    else:
        img = arr_or_img
    out = OUT_DIR / f"{name}.jpg"
    img.save(out, quality=82, optimize=True)
    print(f"  ✓ {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")


# ── Scenes ───────────────────────────────────────────────────────────────────

def autumn_day():
    g = vertical_gradient([
        (0.00, (95, 78, 45)),       # warm sky-haze top
        (0.30, (180, 120, 55)),     # honey
        (0.55, (210, 145, 50)),     # gold
        (0.75, (140, 75, 30)),      # russet
        (1.00, (60, 35, 20)),       # forest floor
    ])
    g = add_horizontal_haze(g, H * 0.55, 0.06, 0.35, (255, 200, 130))
    g = add_noise(g, 7)
    save(g, "autumn-day")


def autumn_dusk():
    g = vertical_gradient([
        (0.00, (40, 25, 50)),
        (0.35, (130, 60, 70)),
        (0.55, (210, 110, 60)),
        (0.80, (90, 45, 35)),
        (1.00, (25, 15, 18)),
    ])
    g = add_horizontal_haze(g, H * 0.62, 0.04, 0.5, (255, 170, 90))
    g = add_noise(g, 6)
    save(g, "autumn-dusk")


def summer_day_clear():
    g = vertical_gradient([
        (0.00, (40, 95, 175)),      # deep sky
        (0.45, (115, 175, 230)),    # bright cyan
        (0.70, (220, 240, 250)),    # haze
        (0.90, (155, 195, 110)),    # field
        (1.00, (85, 130, 60)),
    ])
    g = add_horizontal_haze(g, H * 0.62, 0.05, 0.4, (255, 240, 200))
    g = add_noise(g, 5)
    save(g, "summer-day-clear")


def summer_day():
    g = vertical_gradient([
        (0.00, (95, 130, 180)),
        (0.45, (175, 195, 215)),
        (0.75, (170, 195, 130)),
        (1.00, (90, 130, 70)),
    ])
    g = add_noise(g, 6)
    save(g, "summer-day")


def spring_day():
    g = vertical_gradient([
        (0.00, (130, 180, 210)),
        (0.45, (210, 220, 200)),
        (0.70, (180, 215, 145)),
        (1.00, (95, 145, 75)),
    ])
    g = add_horizontal_haze(g, H * 0.55, 0.05, 0.35, (255, 245, 220))
    g = add_noise(g, 5)
    save(g, "spring-day")


def winter_frost_aus():
    # Pale, breath-cold dawn over frosted grass — no snow.
    g = vertical_gradient([
        (0.00, (130, 145, 165)),    # cold grey
        (0.40, (200, 210, 215)),    # pale haze
        (0.65, (215, 215, 205)),    # frost glow
        (0.85, (140, 145, 130)),    # leafless ground
        (1.00, (70, 75, 65)),
    ])
    g = add_horizontal_haze(g, H * 0.65, 0.07, 0.45, (245, 240, 225))
    g = add_noise(g, 5)
    save(g, "winter-frost-aus")


def winter_day():
    g = vertical_gradient([
        (0.00, (110, 130, 155)),
        (0.50, (180, 190, 200)),
        (0.85, (140, 145, 140)),
        (1.00, (60, 65, 65)),
    ])
    g = add_noise(g, 5)
    save(g, "winter-day")


def night_clear_fullmoon():
    g = vertical_gradient([
        (0.00, (5, 8, 25)),
        (0.45, (15, 22, 55)),
        (0.75, (35, 42, 75)),
        (1.00, (10, 12, 22)),
    ])
    img = Image.fromarray(np.clip(add_noise(g, 4), 0, 255).astype(np.uint8))
    img = add_stars(img, density=0.0015, brightness=230)
    img = add_disc(img, x=int(W * 0.72), y=int(H * 0.28), radius=70, color=(245, 240, 225))
    save(img, "night-clear-fullmoon")


def night_clear_dark():
    g = vertical_gradient([
        (0.00, (3, 4, 14)),
        (0.50, (10, 14, 40)),
        (1.00, (5, 8, 18)),
    ])
    img = Image.fromarray(np.clip(add_noise(g, 3), 0, 255).astype(np.uint8))
    img = add_stars(img, density=0.0030, brightness=240)
    save(img, "night-clear-dark")


def night_cloudy():
    g = vertical_gradient([
        (0.00, (15, 18, 32)),
        (0.45, (40, 45, 60)),
        (0.75, (30, 32, 45)),
        (1.00, (8, 10, 18)),
    ])
    g = add_horizontal_haze(g, H * 0.45, 0.10, 0.35, (90, 95, 115))
    g = add_noise(g, 4)
    save(g, "night-cloudy")


def night_generic():
    g = vertical_gradient([
        (0.00, (4, 6, 18)),
        (0.55, (15, 20, 45)),
        (1.00, (4, 6, 14)),
    ])
    img = Image.fromarray(np.clip(add_noise(g, 3), 0, 255).astype(np.uint8))
    img = add_stars(img, density=0.0010, brightness=220)
    save(img, "night-generic")


def dawn_generic():
    g = vertical_gradient([
        (0.00, (35, 30, 75)),
        (0.40, (190, 130, 130)),
        (0.65, (245, 180, 130)),
        (0.90, (130, 100, 80)),
        (1.00, (50, 40, 35)),
    ])
    g = add_horizontal_haze(g, H * 0.6, 0.04, 0.4, (255, 210, 160))
    g = add_noise(g, 5)
    save(g, "dawn-generic")


def dusk_generic():
    g = vertical_gradient([
        (0.00, (30, 25, 60)),
        (0.35, (120, 70, 95)),
        (0.55, (220, 130, 95)),
        (0.80, (90, 60, 60)),
        (1.00, (20, 15, 25)),
    ])
    g = add_horizontal_haze(g, H * 0.55, 0.05, 0.45, (255, 175, 120))
    g = add_noise(g, 5)
    save(g, "dusk-generic")


def day_generic():
    g = vertical_gradient([
        (0.00, (75, 130, 195)),
        (0.50, (175, 200, 220)),
        (0.85, (165, 185, 145)),
        (1.00, (85, 115, 80)),
    ])
    g = add_noise(g, 5)
    save(g, "day-generic")


SCENES = [
    ("autumn-day", autumn_day),
    ("autumn-dusk", autumn_dusk),
    ("summer-day-clear", summer_day_clear),
    ("summer-day", summer_day),
    ("spring-day", spring_day),
    ("winter-frost-aus", winter_frost_aus),
    ("winter-day", winter_day),
    ("night-clear-fullmoon", night_clear_fullmoon),
    ("night-clear-dark", night_clear_dark),
    ("night-cloudy", night_cloudy),
    ("night-generic", night_generic),
    ("dawn-generic", dawn_generic),
    ("dusk-generic", dusk_generic),
    ("day-generic", day_generic),
]


def main() -> None:
    print(f"Generating {len(SCENES)} scene posters → {OUT_DIR.relative_to(ROOT)}/")
    for _, fn in SCENES:
        fn()
    print(f"\nDone. {len(SCENES)} posters generated.")
    print("\nTo upgrade a scene to a live video loop:")
    print("  Drop <scene-id>.mp4 (and optional .webm) alongside the poster JPG.")
    print("  The manifest already references those paths — no code changes needed.")


if __name__ == "__main__":
    main()
