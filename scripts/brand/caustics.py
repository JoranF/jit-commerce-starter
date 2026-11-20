# Gebruik: python3 scripts/brand/caustics.py <uit.png> <grootte> <tijd>
# Lichtval: python3 scripts/brand/caustics.py apps/storefront/public/stores/lichtval/caustics.png 384 1.7
"""Seamless water-caustic texture (warm light network) as RGBA PNG.
Iterated domain warp of periodic sin/cos terms (period 2*pi over the tile),
so the tile repeats without seams. Alpha carries the light, colour is warm white."""
import sys
import numpy as np
from PIL import Image

out, N, t = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
TAU = 2 * np.pi
y, x = np.mgrid[0:N, 0:N].astype(np.float64) / N
px, py = x * TAU, y * TAU
ix, iy = px.copy(), py.copy()
c = np.ones_like(px)
inten, K = 0.005, 250.0
for n in range(5):
    tt = t * (1.0 - 3.5 / (n + 1))
    ix, iy = px + np.cos(tt - ix) + np.sin(tt + iy), py + np.sin(tt - iy) + np.cos(tt + ix)
    c += 1.0 / np.hypot(K / (np.sin(ix + tt) / inten), K / (np.cos(iy + tt) / inten))
c /= 5.0
c = 1.17 - np.power(np.abs(c), 1.4)
light = np.clip(np.power(np.abs(c), 8.0), 0, 1)
light = np.clip((light - 0.12) / 0.88, 0, 1) ** 1.7
alpha = Image.fromarray((light * 255).astype(np.uint8), "L")
rgba = Image.new("RGBA", (N, N), (255, 224, 170, 0))
rgba.putalpha(alpha)
rgba.save(out, optimize=True)
print(out, rgba.size, "mean alpha", round(float(light.mean()), 3))
