# Autumn courtyard — round 1 independent visual verdict

Inspected `target.png`, `rounds/round-1.png`, `rounds/baseline.png`, and both contact sheets with the image viewer. Calibrated against the fixed **4.8 / 10** normalized baseline. This assessment covers visible visual similarity only; the bottom caption text is excluded. Functionality and performance are outside this verdict.

| Dimension | Round 1 | Change from baseline | Visual evidence |
| --- | ---: | ---: | --- |
| Composition | 2.3 / 3 | 0.0 | The recognizable architectural arrangement is retained, but the view still places the stair foot, screen base, and tree base lower than the target. Crown silhouette and rock proportions remain appreciably different. |
| Lighting and color | 1.9 / 3 | +0.5 | Cleaner ivory walls, pale stone tops, warmer timber, and cooler blue water improve material separation. The pond is now too uniformly pale/milky, and the canopy has many very bright small marks instead of the target's broad luminous yellow washes. |
| Materials and mark-making | 1.0 / 3 | +0.3 | Timber and bark have more visible pigment variation; rock planes and reflections have received useful breakup. Much of the scene still reads as hard 3D surfaces with a busy texture applied. Crown facets, uniformly pale rock tops, fine flooring streaks, and continuously distorted reflections remain unlike the target's overlapping washes and selective paper reserves. |
| Details | 0.5 / 1 | +0.1 | Floating leaves have gained tapered shapes and variation, and stones have more surface detail. Leaf-cluster edges, chipped stone contours, bark creases, and selected dark reflection fragments still need stronger painted construction. |
| **Total** | **5.7 / 10** | **+0.9** | **A visible palette and surface improvement, with the main asset and brush-language mismatch unresolved.** |

## Changes that helped

- The warm/cool balance is closer: orange-brown decking, cream walls and stones, blue water. The olive/tan veil of the baseline is reduced.
- The tree trunk now has visible warm mottling and directional variation instead of a nearly flat brown surface.
- The crown edge has some protrusions and internal openings; the baseline's smooth inflated lobes have been reduced.
- Reflections no longer look like perfectly continuous, crisp duplicated geometry. The screen remains identifiable through its distortion.
- Rocks are brighter and their facets are more visible; the three floating leaves have a less generic oval silhouette.

## Regressions and limits

The canopy trades the baseline's rounded blobs for a crumpled, angular surface with numerous pale pointed flecks. Its large underlying masses remain legible as geometry. The target instead has broad translucent golden clusters, softly scalloped boundaries, sparse dark overlaps, and relatively few tiny bright marks. More fine foliage marks would intensify the present problem.

The pond has lost useful dark/value structure. The target contains a pale upper-left region, a deeper cyan/teal lower-right region, broad irregular wash patches, and identifiable dark tree/post/screen fragments. Round 1 washes much of the pond into the same pale cyan. Tree and column reflections have become muted tan-gray, and the right-side reflected forms almost disappear. Its remaining grid reflection is bent continuously, whereas the target interrupts the grid with discrete broken pigment edges. This is partial reflection improvement with a new contrast/identity cost.

Some surface treatment is now too evenly busy. The deck, staircase, and ceiling show repeated fine pale streaks, and the stones show uniformly bright tops separated from flat cool side faces by clean polygon edges. Texture density does not yet follow the selective broad-wash/middle-mark/fine-grain hierarchy visible in the target.

## Highest-impact work for the next implementation agent

1. **Rebuild the canopy's visible cluster language.** Keep the broad placement, but reduce sharp pale specks and flat triangular flashes. Use larger overlapping yellow/ochre wash clusters with rounded/scalloped irregular boundaries, a few paper holes, and warmer overlap pockets. Let the outer perimeter breathe. Raise the low right-hand canopy mass toward the target's silhouette without moving the trunk independently. Preserve the improvement over the original smooth blobs.
2. **Restore pond depth and recognizable reflections while breaking their edges.** Introduce several broad translucent sage/cream/cyan wash regions, with deeper teal toward the lower-right. Retain darker cool silhouettes for the tree, posts, and selected screen rails; break them into uneven segments using varied opacity and small lateral offsets. Avoid globally blurring or whitening the reflection field. The target's reflected object identity should survive the breakup.
3. **Replace uniform fine surface noise with material-specific middle-sized washes.** On timber, use longer warm ochre/russet bands, limited pale dry-brush gaps, and intermittent darker seams; reduce all-over tiny light streaks. On plaster, leave larger quiet ivory reserves with sparse cool/warm stains. On stones, add several irregular intermediate facets and chipped contour changes, with broad ivory and cool-gray washes that cross or soften selected edges. Keep grain subordinate to those larger marks.
4. **Correct the shared camera framing modestly.** Architecture is still vertically low relative to the target. Adjust the view as a whole and compare the stair foot, tree base, far pond edge, and screen base together; do not independently translate objects to fit one screenshot. Then tune a few foreground rocks toward the target's larger, less regular silhouettes.
5. **Control the same treatment across every view.** The material changes are visibly global and should remain so. Prioritize the canopy, timber, paving, and water fixes as shared asset/material work, then verify the contact-sheet views for excessive scratchiness, pallor, and loss of seasonal differentiation.

## Whole-app consistency from the contact sheets

The brighter palette and mottled timber propagate to the bridge, gate, study, stairs, and courtyard. This is evidence of a shared treatment rather than a courtyard-only visual change. Study furniture and stair timber are visibly less flat; blue roof/wall surfaces are also less dominated by the baseline's large pale spots. The tea-room image changes little, so its previously coherent palette has not visibly regressed.

The same global limitations propagate: canopy highlights appear granular/angular in approach, forecourt, garden, and lookout views; close wood surfaces can be scratchy; gate/forecourt paving is very pale and busy. The approach/lookout autumn trees also appear more uniformly lemon yellow than the baseline's broader ochre/orange range. That is a consistency concern, not a claim that those unreferenced views should match a specific golden image. The contact sheets show no obvious new composition failure, but they do not establish an exact reference match outside the supplied courtyard target.
