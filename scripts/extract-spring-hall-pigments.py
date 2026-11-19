"""Material-only extracts from the locked user-supplied spring main-hall golden.

No object contours or architectural layouts enter these repeating surface maps.
Keep all prior autumn swatches not listed here, and retain their measured profiles.
"""
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps

root = Path(__file__).resolve().parents[1]
source = Image.open(root / '.dream-loop/spring-main-hall/target.png').convert('RGB')
palette = root / 'js/paint-palette.js'
profiles = json.loads(re.search(r'export const PIGMENTS = (.*);', palette.read_text(), re.S)[1])
patches = {
    # Interior of the near timber post; longitudinal fibers remain vertical.
    'wood': ((398, 223, 428, 649), (256, 1024), .16),
    # Uninterrupted pale blue ceiling wash, with dry-paper islands.
    'roof': ((596, 6, 1084, 121), (512, 512), .18),
    # Quiet cream wall, clear of screens, beams and foliage boundaries.
    'plaster': ((282, 426, 364, 551), (512, 512), .08),
    # Interior of a foreground slab, excluding every tile seam.
    'floor': ((672, 774, 804, 881), (512, 512), .18),
    # Lawn interior and internal leaf washes, excluding their outside contours.
    'moss': ((482, 663, 591, 712), (512, 512), .11),
    'foliage': ((479, 309, 579, 350), (512, 512), .18),
}

def isotropic_wash(crop, size, seed):
    """Blend square material-only patches, without changing their proportions.

    Orthogonal rotations and nonuniform periodic masks erase the long source
    shadow bands while preserving small irregular pigment boundaries and tooth.
    All samples come from the bounds above, never from a subject silhouette.
    """
    rng = np.random.default_rng(seed)
    side = min(crop.size)
    yy, xx = np.mgrid[0:size[1], 0:size[0]] / size[0]
    total = np.zeros((size[1], size[0], 3), float)
    weight = np.zeros((size[1], size[0]), float)
    for index in range(4):
        left = round((crop.width-side)*index/3)
        top = round((crop.height-side)*(3-index)/3)
        square = crop.crop((left, top, left+side, top+side))
        tile = Image.new('RGB', (side*2, side*2))
        tile.paste(square, (0, 0))
        tile.paste(ImageOps.mirror(square), (side, 0))
        tile.paste(ImageOps.flip(square), (0, side))
        tile.paste(ImageOps.flip(ImageOps.mirror(square)), (side, side))
        tile = tile.resize(size, Image.Resampling.LANCZOS).rotate(index*90)
        pixels = np.asarray(tile).astype(float)
        pixels = np.roll(pixels, tuple(rng.integers(0, size[0], 2)), axis=(0, 1))
        phase = rng.uniform(0, np.pi*2, 3)
        field = (np.sin(xx*np.pi*2+phase[0])*.52
                 +np.cos(yy*np.pi*2+phase[1])*.34
                 +np.sin((xx+yy)*np.pi*2+phase[2])*.22)
        mask = np.exp(field*2.4)
        total += pixels*mask[..., None]
        weight += mask
    return Image.fromarray(np.clip(total/weight[..., None], 0, 255).astype('uint8'))

for name, (bounds, size, strength) in patches.items():
    crop = source.crop(bounds)
    if name in ('roof', 'moss', 'foliage'):
        tile = isotropic_wash(crop, size, {'roof':31, 'moss':53, 'foliage':79}[name])
    else:
        tile = Image.new('RGB', (crop.width * 2, crop.height * 2))
        tile.paste(crop, (0, 0))
        tile.paste(ImageOps.mirror(crop), (crop.width, 0))
        tile.paste(ImageOps.flip(crop), (0, crop.height))
        tile.paste(ImageOps.flip(ImageOps.mirror(crop)), crop.size)
        tile = tile.resize(size, Image.Resampling.LANCZOS)
    tile.save(root / f'assets/paint/{name}.webp', quality=95)
    rgb = np.asarray(tile).astype(float) / 255
    linear = np.where(rgb <= .04045, rgb / 12.92, ((rgb + .055) / 1.055) ** 2.4)
    luminance = linear @ np.array([.2126, .7152, .0722])
    profiles[name] = dict(mean=round(float(luminance.mean()), 5),
                          deviation=round(float(luminance.std()), 5),
                          rgb=[round(float(x), 5) for x in linear.mean((0, 1))],
                          strength=strength)
palette.write_text('// Linear pigment statistics measured by the provenance scripts in scripts/.\n'
                   'export const PIGMENTS = ' + json.dumps(profiles, indent=2) + ';\n')
print('Spring surface extracts:', ', '.join(patches))
