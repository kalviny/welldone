# Autumn courtyard — normalized baseline verdict

## Comparison and fixed baseline score

Visually inspected `rounds/baseline.png` and `target.png`. Both displayed images are 1672 × 941, so this comparison removes the aspect-ratio mismatch in the earlier supplied screenshot. Preserve `baseline-verdict.md` as the separate assessment of `supplied-current.png`.

**Use 4.8 / 10 as the normalized baseline in subsequent round reviews.** This is a subjective visual-similarity score, not a functionality or performance score.

| Dimension | Baseline | Calibration |
| --- | ---: | --- |
| Composition | 2.3 / 3 | Core objects and their left/right relationships closely match. Matching aspect restores a comparable foreground. Vertical framing, foliage silhouette, some stone silhouettes, and object proportions still differ. |
| Lighting and color | 1.4 / 3 | Correct broad yellow/brown/teal families, but too much dull tan/olive, overly even timber color, and insufficient bright ivory/paper-white separation. |
| Materials and mark-making | 0.7 / 3 | Grain exists, but rounded crown masses, smooth gray rock planes, continuous reflections, and generic cloudy surface texture read predominantly as textured 3D. |
| Details | 0.4 / 1 | Architectural features and the three floating leaves are identifiable. Leaf-edge breakup, bark washes, painted rock fractures, and broken reflection marks are missing or weak. |
| **Total** | **4.8 / 10** | **Shared watercolor treatment remains the main opportunity.** |

The 0.1 difference from the supplied-image score is a composition recalibration after normalization; it is not a claimed rendering improvement.

## Framing differences that remain at matching aspect

The normalized baseline is not merely the target rendered in another style. The baseline's stair foot, tree base, folding-screen base, deck boundary, and upper blue wall band are mostly lower in frame. Approximate visual landmarks put the tree/pond-edge base around y=540 in the baseline versus y=500 in the target; the folding screen bottom is around y=520 versus y=480; the stair foot is around y=420 versus y=365. Exact pixel measurements are unnecessary for this baseline, but these differences are too consistent to attribute to texture.

The baseline therefore shows slightly less vertical room between the deck and upper scene, while the tree crown hangs lower: its prominent right mass reaches roughly y=240, versus about y=195 in the golden. Some of that last difference is foliage shape, not camera. The front rocks now have enough foreground to compare, so the earlier wider-image crop is no longer the main concern. The target's front rocks are generally larger, more irregular, and visibly faceted.

First consider a small view adjustment that moves architectural landmarks upward, preserving the existing left/right arrangement. Check the stair foot, post bases, screen, and far pond edge together; do not correct each with separate geometry moves or a 2D warp. Then correct the crown's own silhouette and rock shapes as scene assets. The pond leaves, screen, tree, stair, and shelf layout are already sufficiently close that a wholesale scene rebuild is unwarranted.

The golden includes the small lower-corner title and action; the normalized baseline capture does not display them. This is a visible capture difference only. It does not establish whether UI is absent from the running app. Give this low weight while addressing rendering.

## Prioritized implementation guidance

### 1. Shared material-specific watercolor vocabulary

Replace the nearly uniform cloudy/granular treatment with several scales of marks: broad thin washes, middle-sized pigment blooms and dry-brush interruptions, then restrained paper grain. The target exposes irregular pale paper reserves and deposits stronger pigment along selected boundaries. The baseline largely shades each solid continuously and overlays fine variation; that produces surface noise without the target's painted construction.

Use separate mark distributions for each material throughout the app:

- Plaster: bright ivory, occasional cool/warm cloudy washes, broad areas of near-paper white.
- Timber: warm ochre/orange/russet washes, directionally biased grain, darker intermittent edge pigment, pale dry-brush breaks.
- Bark: warm directional stains and sparse creases rather than a flat tan trunk.
- Stone: large pale angular planes with cool side washes, warm highlights, and exposed paper patches.
- Water: translucent blue-green wash regions with irregular boundaries and interrupted reflections.
- Foliage: overlapping yellow/ochre leaf-cluster marks with holes and varied edge density.

Scale these marks to their materials and represented surface size; avoid applying identical high-frequency grain to everything. Preserve useful straight rails, screens, board perspective, depth, and contact cues. Selective softness is more appropriate than blurring the complete image.

### 2. Foliage silhouettes and internal overlaps

The current crown's large smooth inflated blobs are the strongest asset-level style mismatch. The target has scalloped cluster boundaries, smaller leaf protrusions, occasional tiny gaps, branch glimpses, pale holes, and overlapping translucent yellow marks. Add those through genuine foliage assets/materials that remain coherent as the view changes. Distinguish sunny lemon/cream tops, warmer ochre overlaps, and sparse darker pockets. The existing crown is also darker and heavier in its lower lobes. Retain its broad position but give it a more irregular, airy perimeter. Do not fill it with evenly spaced identical leaf stamps.

### 3. Warm wood, brighter paper, clearer warm/cool balance

The baseline deck and posts are comparatively muted tan/brown, with an olive veil across the foreground. The target has orange-gold decking, richer warm posts, cleaner ivory walls and rocks, and cool blue-green water. Raise the bright end while keeping paper/brush structure in highlights. Reduce the muddy broad foreground shading and increase local material color separation. Put dark accents selectively in timber edges, bark creases, reflection fragments, and contact areas. Exposure and saturation changes alone will not supply the missing material structure.

### 4. Reflections as broken painted marks

The baseline pond contains continuous dark teal post columns, long hard-edged shadow forms, and an unusually crisp continuous reflected screen grid. The target keeps those objects recognizable, but their reflections dissolve into jagged pigment segments and varied translucent wash patches. Introduce small lateral ripple offsets, irregular reflection opacity, and uneven edge breakup, plus broader cyan/sage/cream water regions. Avoid turning the reflections into indistinct noise. The three floating leaves should gain irregular tapered edges, a little pigment accumulation, and subtle shadow separation; their current contours are smooth flat ovals.

### 5. Stone planes, fractures, and paper reserves

Baseline rocks are legible low-poly solids, but their faces are broad smooth gray planes. The target has angular fractured contours and varied smaller facets, with ivory top planes, blue-gray side shadows, ochre traces, dry-brush marks, and visible white paper reserves. Clarify a few large facets and selected chipped edges before increasing texture density. Keep stone colors paler than the surrounding sage bed, and vary the bed with broad translucent mineral washes rather than using the same pattern as the rocks.

## Global versus courtyard-specific scope

The shared renderer/material work is the primary task: watercolor marks, palette/value separation, paper reserves, selective edge treatment, stone language, and water-reflection breakup should carry into every view of the existing app. This courtyard also needs local asset refinement for its canopy and rocks, and a modest calibrated view correction. Improving only this photographed angle would not establish the requested whole-app style transfer.

Keep the result as a live navigable 3D scene with surface-attached materials and actual scene assets. Do not put the full reference image over the render, hide the scene behind it, or use view-specific opaque layers to simulate completion.

## Consistent later-round review

Compare each later 1672 × 941 courtyard screenshot with the same target and this normalized baseline. Report all four rubric components, total, change from **4.8**, the most consequential improvements, any regressions, and remaining highest-priority work. Keep the scoring focused on visual evidence. The parent's separately reported functional harness result is outside this screenshot assessment and is not evidence independently observed by this judge.
