# Panorama — independent visual judgment, round 1

Compared `target.png`, `rounds/round-1.png`, and `rounds/baseline.png` directly at their full 1672 × 941 resolution. This is the first judgment of this panorama target; no tea-room scores were used. Performance and console health earn no visual points.

**Score: 6.60 / 10**

| Category | Score | Judgment |
| --- | ---: | --- |
| Composition | 2.55 / 3 | The principal building, gate, bridge, autumn-tree clusters, foreground pine and mountain layers are impressively close in placement. The current frame is somewhat heavier at the bottom: bridge entrance extends farther down/left, front wall cap sits a little low, and the near retaining wall runs out of frame more abruptly. Mountain profiles are simplified and their hard polygon edges are conspicuous. |
| Lighting | 1.90 / 3 | Warm paper, blue roofs and autumn colors are in the correct family. Target light is softly integrated, with stronger local pigment contrast inside leaves/stone/water but gentler cast shadows. Current yellow foliage is too luminous and uniformly pale, roofs too uniformly blue, ground too olive-gray, and tree shadows too distinctly hard. The sky lacks the target's cool broken cloud washes. |
| Materials | 1.50 / 3 | Paper grain and foliage breakup are a substantial improvement over baseline, but much of the result still reads as textured low-poly 3D. Water has broad diagonal streaks; masonry is a repetitive rectilinear grid; roofs have perfectly regular ruled lines; many leaf crowns are flat disks with noisy surfaces. The target has irregular stone joints, translucent layered foliage, varied pigment pooling, and imperfect edge definition. |
| Details | 0.65 / 1 | Bridge rails, door ironwork, exposed timbers, lantern and roof ridges establish the scene well. Courtyard paving, roof tile variation, wood grain and differentiated tree branching remain weak. White interior objects visible through the central opening are distracting relative to the target. |

## What improved relative to baseline

Round 1 moves the camera significantly closer to the target, adds the needed warm paper cast, breaks up the formerly smooth ellipsoid crowns, improves the water's color family, and restores a stronger autumn palette. The target is now immediately recognizable. The remaining mismatch is predominantly material treatment and atmosphere, so another large camera or layout revision would risk losing the strongest part of the match.

## Highest-impact changes for round 2

1. **Replace regular stone and water surface character.** The front and right retaining walls occupy a large image area and currently read as repeated vertical concrete blocks. Use larger, staggered, irregular polygonal stones, thinner broken joints, and per-stone gray/ochre/blue wash variation. Give paving a related but flatter irregular pattern. Water needs broad subdued blue-green/cream patches, subtle short ripples and broken wall/bridge reflections; remove the obvious long diagonal brush streaks. These should remain surface materials on orbitable geometry.
2. **Make foliage paint-like in volume and color.** Keep existing crown positions. Reduce the most luminous yellow by roughly 10–15%, introduce ochre shadow pockets and smaller pale highlights, and vary orange crowns with rust/brown shadows. Replace the repeated thin pancake silhouette with overlapping clusters of different height and size; hide some hard lower edges through tonal variation. Foreground pine should show several separated branch-supported clouds rather than one continuous broad plate. Use world/object-space multiscale pigment variation rather than adding more screen-space noise.
3. **Soften the lighting and restore atmospheric washes.** Reduce cast-shadow contrast and hard edge visibility without flattening contact at the tree roots and gate. Add restrained cool blue-gray cloud washes to the cream sky, and mottled pale green/blue variation to the mountain geometry. Break the overly straight/segmented mountain outlines with small silhouette irregularities. Keep distant layers significantly lighter than the nearest ridge.

## Highest-impact changes for round 3

1. **Roof and timber finish.** Keep the roof shapes. Break the ruler-straight roof-line repetition with small variations in spacing, opacity and length, and add irregular desaturated blue-gray pigment patches. Timber needs selective warm dark accents and grain, with fewer stark black vertical lines. Inspect and tone down or remove the bright white interior shapes in the main entrance opening if they are unintended scene clutter.
2. **Only then make a small framing correction if needed.** Tower roof currently starts around y=275 versus target y=282, while the near bridge is around y=858 versus target y=842; the scene's vertical spread is slightly too large. Aim to reduce the spread around the scene center by a few percent, then compare the gate and tower anchors again. Do not broadly zoom out to baseline framing. Preserve the current building widths and dominant diagonal bridge direction.
3. **Use remaining effort on visible local detail.** Add subtle variations in gate wood and bridge planks, a few irregular stone-edge highlights and branch forks under nearby crowns. These are secondary to the surfaces above; more decorative leaf particles will not materially raise the score.

## Guardrails for the next judgments

- All architecture, trees, terrain and mountains must stay real orbitable scene geometry. Do not paste the target or a full-scene rendered illustration over the view.
- Preserve the good correspondence of the tower, main roofs, gate and central autumn tree while adjusting materials.
- Avoid strengthening a uniform paper/noise overlay as a substitute for object-specific pigment, silhouette and surface variation. The existing grain is already visible enough.
- A substantial next-round gain should come from stone, water, foliage and atmosphere together. One improved subsystem with unchanged flat shading elsewhere would merit only a modest score increase.
