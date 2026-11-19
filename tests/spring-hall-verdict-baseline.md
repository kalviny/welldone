# Spring main-hall baseline visual verdict

Compared visually at the supplied matching 1672 × 941 view:

- Golden: `.dream-loop/spring-main-hall/target.png`
- Baseline assessed: `.dream-loop/spring-main-hall/supplied-current.png`
- Scope: subjective visual similarity only. No performance points. The later fresh `rounds/baseline.png` is not the image scored here.

| Criterion | Score | Evidence |
| --- | ---: | --- |
| Composition | 2.9 / 3 | Camera, beam framing, entrance anchor, trees, pond, posts, and door panels are already almost identical. Preserve them. |
| Lighting / color | 1.8 / 3 | Current render has the spring palette, but the large surfaces are more uniformly brown/olive and the illumination is comparatively flat. Golden has lighter peach-ochre wood, warm cream paper, pale blue-gray overhead fields, yellow-green canopy tops, and distinct local light and shade. |
| Materials / mark-making | 1.2 / 3 | Existing paper treatment is visible, but much of it reads as blurry, evenly distributed noise. Golden has layered translucent pigment, dry paper reserves, directional wood strokes, pooled watercolor edges, and leafy clusters. Current foliage is particularly crumpled and faceted. |
| Details | 0.6 / 1 | Main objects are present; bark, leafy edges, pond reflections, chalky rocks, and fine paper/pigment variation are less convincing. |
| **Total** | **6.5 / 10** | The layout is very close. Most of the remaining gap is in shared surface treatment and local light/color structure. |

## Prioritized changes

1. **Make the shared wood treatment lighter, warmer, and directional.** The front crossbeam and the two broad central posts currently read as comparatively flat muted brown blocks. Golden uses peach/ochre washes, softly broken vertical grain on posts, horizontal grain on beams, and pale warm reserves. Side wood also needs reconciliation: the leftmost near posts have much darker, more photographic bark-like streaks than the broad central posts. Retain a coherent painted wood material with directional fibers, irregular pigment density, gentle light-facing edge variation, and restrained shadow seams. Apply by surface orientation/UV or object-space coordinates so it works throughout the building.

2. **Replace the crumpled foliage appearance with overlapping leafy paint masses.** Keep every tree position, canopy envelope, and branch arrangement. Current green crowns have oversized angular folds with smooth olive midtones; pink blossoms look like folded pink fabric. Golden builds crowns from many softly scalloped, partially transparent clusters, with fine uneven outer edges and broken interior marks. Add fresh yellow-green upper clusters and muted gray-green lower pockets; use warm light coral blossom highlights, softer salmon pigment pools, and small paper gaps. The change should be in reusable geometry/material/assets that remain convincing while navigating, rather than a fixed-camera overlay.

3. **Give roof, ceiling, and walls localized watercolor fields with paper reserves.** The ceiling currently resembles a uniform soft blue texture. Golden has overlapping pale blue-gray washes separated by irregular near-white paper areas, finer fibrous granulation, and modest darker wash pools at selected edges. The cream walls similarly need quiet warm/cool variation rather than a blanket tint. Keep the geometry and existing blue roof palette; vary pigment at several scales and avoid multiplying equally strong coarse noise over every surface.

4. **Paint the ground as light and shadow, not a single grass rectangle.** Golden grass has irregular yellow-green/gray-green patches, pale dry areas, and soft grounded shade spreading beneath the trees, particularly toward the lower left of the nearer trunk. Current lawn has uniform horizontal bands and little convincing tree contact. Add broad low-contrast patches plus localized canopy/contact shading. Keep the pond outline and rock positions; soften the rocks' polygonal face boundaries with chalky pale gray watercolor and make the water's blue-green reflections more irregular.

5. **Replace the foreground floor's evenly blurry brown texture with broad warm wash structure.** Golden's foreground has pale peach paper reserves, diffuse warm light patches, darker pooled pigment toward portions of slab edges, and long soft architectural shadow/wash forms. Current foreground is densely brown and uniformly textured, with the grid seams calling too much attention to themselves. Use broad, slow-changing wash variation plus fine paper tooth; soften/lighten the seams and preserve the exact slab layout.

## Constraints for the implementation rounds

- No camera adjustment is warranted: the golden composition is already nearly matched.
- Preserve the spring selection, entrance anchor, interactive 3D navigation, existing architecture, and previous app-wide style progress.
- Prefer improvements to shared materials and reusable foliage/ground assets so other views and seasons inherit the treatment appropriately.
- Do not use a full-reference image overlay or replace navigable geometry with a fixed-view painting.
- Highest return is stronger paint structure and local palette separation; simply increasing grain strength or reducing polygon count would not address this gap.
