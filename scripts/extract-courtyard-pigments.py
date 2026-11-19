"""Extract only material swatches from the user-supplied autumn courtyard.

Run with the bundled Python runtime and the ignored source image as argument.
No scene, object silhouette, or full reference is embedded in runtime assets.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps

root = Path(__file__).resolve().parents[1]
source = Image.open(sys.argv[1]).convert("RGB")
output = root / "assets/paint"
patches = {
    "wood": ((1400, 182, 1425, 401), (256, 1024), .16),
    "bark": ((688, 276, 731, 451), (256, 1024), .22),
    "plaster": ((564, 224, 663, 345), (512, 512), .065),
    "roof": ((1159, 23, 1304, 112), (512, 512), .12),
    "stone": ((1330, 830, 1416, 887), (512, 512), .17),
    "wash": ((27, 653, 219, 807), (512, 512), .12),
    "water": ((542, 611, 671, 704), (512, 512), .27),
    "foliage": ((310, 30, 462, 112), (512, 512), .19),
}
profiles = {}
for name, (bounds, size, strength) in patches.items():
    crop = source.crop(bounds)
    # Mirrored edge pairs avoid seams without inventing surface mark shapes.
    tile = Image.new("RGB", (crop.width * 2, crop.height * 2))
    tile.paste(crop, (0, 0))
    tile.paste(ImageOps.mirror(crop), (crop.width, 0))
    tile.paste(ImageOps.flip(crop), (0, crop.height))
    tile.paste(ImageOps.flip(ImageOps.mirror(crop)), crop.size)
    tile = tile.resize(size, Image.Resampling.LANCZOS)
    tile.save(output / f"{name}.webp", quality=95)
    rgb = np.asarray(tile).astype(float) / 255
    linear = np.where(rgb <= .04045, rgb / 12.92, ((rgb + .055) / 1.055) ** 2.4)
    luminance = linear @ np.array([.2126, .7152, .0722])
    profiles[name] = dict(mean=round(float(luminance.mean()), 5),
                          deviation=round(float(luminance.std()), 5),
                          rgb=[round(float(x), 5) for x in linear.mean((0, 1))],
                          strength=strength)

# High-pass paper tooth only; the wall's shape and color never enter this map.
paper = source.crop((564, 224, 663, 345)).convert("L").resize((384, 384), Image.Resampling.LANCZOS)
a = np.asarray(paper).astype(float)
b = np.asarray(paper.filter(ImageFilter.GaussianBlur(2.2))).astype(float)
paper = Image.fromarray(np.clip(128 + (a - b) * 3, 0, 255).astype("uint8"))
paper.save(output / "paper.webp", quality=95)

# Distant atmospheric pigment continues to use the earlier panoramic sample.
profiles["mountain"] = dict(mean=.5877, deviation=.06181, rgb=[.576, .591, .592], strength=.13)
(root / "js/paint-palette.js").write_text(
    "// Linear pigment statistics measured by scripts/extract-courtyard-pigments.py.\n"
    "export const PIGMENTS = " + json.dumps(profiles, indent=2) + ";\n")
print("Extracted", ", ".join(patches), "and paper tooth")
