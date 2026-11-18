# Panorama — independent visual judgment, round 2

Compared `target.png`, `rounds/round-2.png`, `rounds/round-1.png`, and the prior verdict directly. This is an independent judgment of the panorama image, using the same rubric and the prior 6.60 as calibration. Measured FPS and console health receive no visual credit. The judgment concerns the supplied camera view; it does not independently verify orbitability.

**Score: 6.95 / 10** (+0.35 from round 1)

| Category | Score | Judgment |
| --- | ---: | --- |
| Composition | 2.55 / 3 | Architecture, dominant tree groups, bridge, and layered mountain placement remain recognizably close. The principal framing strengths and weaknesses are effectively unchanged. The bridge reaches too far down/left, the foreground wall extends too low, and the tower roof is slightly too high. Near pine crowns remain broad continuous shelves. Mountain contours remain smoother and more polygonal than the target. |
| Lighting | 2.05 / 3 | Less luminous yellow foliage, some cool sky wash, and more coherent water color improve the match. However, the target has stronger localized pigment contrast with softer illumination. Current tree shadows remain hard; grass is flat olive; walls are unusually bright cream; foliage reads as softly lit solid clay. The sky wash is sparse, and mountains remain nearly uniform translucent fills. |
| Materials | 1.65 / 3 | Stone courses, paving, and water are visibly improved. The retaining wall now reads as individual stones instead of a vertical concrete grid, but the stones are still repeated rounded rectangular tiles with uniform fill, lacking the target's chipped edges, broken joints, and mottled facets. Paving looks like small neat pavers rather than irregular large slabs. Water loses the worst diagonal streaks but remains a nearly even cyan surface with weak visible broken reflections. Roofs and foliage remain the largest painterly-style blockers. |
| Details | 0.70 / 1 | Improved paving and stone articulation add useful detail. Gate, rails, lantern, exposed framing, and tree trunks retain good correspondence. Roof tiling is still mechanically ruled; bridge planks lack individual variation; white interior shapes remain distracting; nearby trees need narrower branch forks and differentiated foliage masses. |

## What genuinely improved

- Stone courses now have a staggered rhythm and broad color variation. This is better geometry/surface organization, even though the individual stone finish is still too synthetic.
- Paving is visibly articulated, and the moat is more coherent in hue with less distracting diagonal streaking.
- Yellow crowns are closer to ochre and have slightly better internal value separation.
- Sky wash gives a first hint of the target atmosphere.

These are modest gains across multiple systems. They do not yet change the scene's dominant reading from a 3D diorama with a paper overlay to a watercolor illustration of that same geometry.

## Final-round priority: change the material treatment, not just noise strength

The same blocker is present for two judgments: perfectly legible mesh surfaces with comparatively uniform object color, covered by paper grain. The target's paint variation belongs to each object and changes at several spatial scales. Another pass that merely increases noise or nudges saturation will probably plateau below 8.

Keep the real orbitable scene and the current architectural layout. Make one coordinated material change that supplies **broad object-specific pigment patches, intermediate broken wash shapes, and selective small dark accents**, with less reliance on uniform grain and solid lighting gradients. This is the high-impact conceptual adjustment. It can be implemented with procedural/object-space textures on actual geometry; it does not require any target-image backdrop or full-scene illustration overlay.

### 1. Roof treatment — largest unaddressed high-contrast surface

- All major roof faces are nearly uniform blue with dense, perfectly straight, regularly spaced dark lines. The target has desaturated blue-gray washes, irregular tile boundaries, broken line visibility, and patches of cream paper showing through.
- Slightly lighten and desaturate the broad roof fields. Add coarse uneven pale and dark blue-gray patches aligned with the roof surface, not the screen. Break tile-line opacity and continuity and vary neighboring line spacing subtly. Preserve the roof silhouette and major ridges.
- Avoid stronger embossed tiles or deeper grooves: those would make the clay/3D reading worse. The strongest accents should be selective eaves/ridges rather than every tile boundary.
- This treatment should cover the gate roof, broad central roof, tower tiers, and front wall caps consistently. Changing just the tower would leave most of the mismatch intact.

### 2. Tree crowns and lighting — replace the solid-clay reading

- The current crowns contain rounded bumps but retain continuous, flat lower outlines and a smooth, uniformly shaded upper volume. They resemble stacked clay cushions. Target crowns have clusters of overlapping semi-transparent paint, with interior color pockets and small openings that expose branches.
- For the central golden/orange tree, introduce larger ochre/rust shadow pockets and smaller pale cream/yellow patches. Reduce uniform bulb shading. Break its lower silhouette into several offset masses with a few gaps; retain its overall width and position.
- Divide the large foreground pine shelf into clearly separated branch-supported clouds, including a few darker blue-green pockets. Current near pine is too uniformly light olive and hides nearly every interior branch.
- The left and rear tree groups need the same pigment logic at lower contrast and lower detail. Do not merely add many more tiny foliage particles.
- Soften or substantially lower contrast of the hard ground shadows at the right-side trees and foreground pine. Preserve only gentle root/branch contact. The target integrates tree shadow into broken ground wash instead of drawing a crisp mesh silhouette on grass.

### 3. Stone, courtyard, and water — finish the new surfaces

- Current retaining-wall stones are oversized rounded rectangles with smooth flat centers. Their alternating gray/light fills form a regular mosaic. Add fractured angular edges, partial joints, within-stone warm/cool variation, and thin localized pale edge accents. Reduce the impression that each entire block was assigned one random color.
- Courtyard paving should become larger irregular slabs, with finer broken joints and stronger broad cream/gray wash variation. Current many-small-paver frequency is unlike the target. Add a few uneven warm slab highlights near the gate and central tree rather than a uniform checkerboard.
- The water is too uniformly cyan and too clean. Add broad subdued blue-green/cream patches, short irregular pale ripples, and stronger but broken near-wall/bridge reflections. The implementation may include a real reflector, but only the reflection visible in the final image earns credit; it is currently too subtle to establish the target's luminous mottled surface.
- Keep water quieter than the roofs and foliage. Do not restore long diagonal texture strokes or create a mirror-like reflection.

## Secondary fixes only after the above

1. **Atmospheric background:** expand the existing cool sky wash into several broad faint broken patches. Add restrained pale green/blue mottling to mountains and small contour irregularities. The target's left mountain has more local definition while distant central ridges dissolve into the paper; current layers are too evenly filled. Avoid obvious rectangular plane borders or pasted flat scenery.
2. **Interior distraction:** remove or tone down the bright white shapes visible through the main ground-floor entrance, around the center of the image. They are not a useful target detail.
3. **Bridge and timber:** add a small number of uneven plank seams and warm wood strokes; vary some frame/post darkness. Avoid turning every edge into a black outline.
4. **Framing:** the same small vertical-span mismatch remains (tower roof slightly high, bridge/front wall low). A very small correction may help, but do not sacrifice the current horizontal placement. Material work has higher expected return than reworking the camera.

## Remaining blockers to a perfect match

- Roof silhouettes and eave positions are close but not identical; tile frequencies, pigment distribution, and line weights are noticeably different.
- Foreground pine branch/crown arrangement differs substantially, and most crowns remain flatter and more contiguous than the target.
- Stone shapes, paving scale, surface reflectance, and water wash pattern remain visibly synthetic.
- Target paper is integrated with each painted surface; current strong uniform grain does not reproduce that integration.
- Mountain silhouettes, translucency variation, cloud distribution, and distant foliage layering remain approximate.
- Cast shadows, courtyard/grass hues, trunk branching, gate ironwork placement, individual planks, and small decorative specks differ.

**Recommended final-round allocation:** prioritize roof material treatment and foliage pigment/shadow treatment together, then finish the stone and water textures. These changes address the repeated architectural rendering problem. Extra decorative objects or more global paper grain are unlikely to yield a material score increase.
