# Encoding and Design

Status: research complete. Goal: a "walkable 3D bar chart of economic activity" that is both geographically realistic and legible. These two goals fight each other, and the data-viz literature is blunt that 3D plus magnitude comparison is the hardest case in graphical perception. Most recommendations below are about buying back the accuracy you lose by going 3D.

## 1. Scaling a financial metric to building height

The core problem: linear scales cannot show values more than about three orders of magnitude apart on a normal display, but funding/valuation/revenue span $0 to billions (9+ orders) ([linear vs log](https://www.syncfusion.com/blogs/post/linear-vs-logarithmic-scales-in-chart), [Lost in Magnitudes](https://arxiv.org/pdf/2404.15150)). The tradeoff: a log scale fits the range but destroys ratio and difference judgments and confuses non-experts ([linear vs log](https://www.syncfusion.com/blogs/post/linear-vs-logarithmic-scales-in-chart)). A log-height tower no longer lets a founder read "10x more funding"; it reads "a bit taller."

**Recommendation: use a tempered power scale (sqrt family) as the default; offer log as an expert toggle.**
- Pure linear: one unicorn becomes a skyscraper, everything else a pancake. Reject.
- Pure log: legible but flattens real differences. Good as a secondary mode.
- Power scale with a low exponent (`d3.scalePow().exponent(~0.3 to 0.5)`, where `scaleSqrt` is the 0.5 case) gives moderate compression that tames the unicorn without fully flattening ratios ([d3-scale](https://www.npmjs.com/package/d3-scale), [d3 in depth](https://www.d3indepth.com/scales/)).
- Quantile/rank (`d3.scaleQuantile`) is most robust to outliers but encodes rank, not magnitude. Good for an "everyone visible" mode, bad for magnitude fidelity.

Guardrails regardless of scale:
1. Clamp the domain (`.clamp(true)`) and set an explicit `[minHeight, maxHeight]` tied to plausible building heights, so the tallest tower is legibly tall, not absurd.
2. Set a floor (minimum height, e.g. 3 to 5 stories) so a $0/unfunded company is still a visible building.
3. Consider symlog if $0 and near-zero values must be included, since pure log is undefined at 0.

## 2. Which channel encodes which metric

The governing result is Cleveland and McGill (1984), ranking perceptual tasks by accuracy: (1) position on a common scale, (2) position on nonaligned scales, (3) length/direction/angle, (4) area, (5) volume/curvature, (6) shading/color saturation ([Cleveland and McGill](https://creativeartsadventure.wordpress.com/2017/01/02/cleveland-mcgill-graphical-perception-theory-experimentation-and-application-to-the-development-of-graphical-methods/), [UW CSE412](https://courses.cs.washington.edu/courses/cse412/21sp/lectures/CSE412-Perception1.pdf)). Consequences:
- **Height (a length channel) is the most accurate**, so reserve it for the single most important metric.
- **Color and area are weak quantitative channels** (ranks 6 and 4), suited to secondary/ordinal/categorical info, not fine magnitude.
- **Area is systematically underestimated** (Stevens power-law exponent ~0.87), so encode value as area and derive the linear dimension via square root; never set width linearly to a value ([Stanford CS448B](https://hci.stanford.edu/courses/cs448b/f09/lectures/CS448B-20091005-Perception.pdf), [Stevens power law](https://santhoshsoundar.blog/power-law/)).

Recommended mapping:

| Metric | Channel | Why |
|---|---|---|
| **Funding raised** | **Building height** | Most accurate channel for the headline number; "tall = big money." Mirrors Git City (contributions drive height). |
| **Headcount** | **Footprint area / mass** | Maps to "how much space a company takes up." Area is a weak channel, so it suits the least precise read. Encode value as area (sqrt the linear factor). |
| **Valuation** | **Color value / brightness** (sequential ramp) | Adds info beyond funding; lightness survives all colorblindness types. Do not put it on a second length channel competing with height. |
| **Revenue** | **Emissive lit-window intensity** | "Lights on = company alive / has revenue." Coarse but intuitive. Mirrors Git City windows. |
| *(optional)* **Sector** | **Hue (categorical)** | Only if hue is not already used for valuation; cap at <= 8 categories with a legend. |

## 3. 3D perception pitfalls and mitigations

The literature is harsh that 3D bar charts are perceptually broken for comparison ([Domo](https://www.domo.com/learn/charts/3d-charts), [Highcharts](https://www.highcharts.com/blog/best-practices/3d-graph-useful-visualization-or-misleading-illusion/)): occlusion (front hides back), foreshortening (far objects look compressed), baseline/perspective distortion, and higher mental effort. Capline cannot avoid 3D (it is the whole concept), so mitigate rather than eliminate:
1. **Always-available numeric readouts** on hover/click (exact funding, valuation, revenue, headcount). This is the single biggest accuracy recovery.
2. **Ranked side panel** ("Top by funding") defeats occlusion and foreshortening for the comparison that matters most.
3. **Persistent 2D legend** mapping each channel to its scale (height ladder, color ramp, footprint key).
4. **Orthographic top-down "compare mode" camera**, which removes perspective foreshortening.
5. **Camera constraints** (bounded pitch/zoom, curated presets) to avoid pathological angles.
6. **Ground reference grid / height tick rings** to give the eye a common scale.

## 4. Real geometry vs abstract blocks

Central tension, resolved as a **hybrid leaning to "real footprint, overridden height."** MapLibre `fill-extrusion` can extrude the real OSM footprint while `fill-extrusion-height` and `-color` are data-driven, so the true polygon stays but height comes from a financial metric ([MapLibre fill-extrusion](https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/), [MapLibre style spec](https://maplibre.org/maplibre-style-spec/layers/)).

Caveat: real footprints have irregular areas uncorrelated with any metric, which would make footprint-as-headcount noisy. Resolution:
- Keep the real footprint outline for context and realism (this is what makes it a city, not a generic bar chart, and is the differentiator vs a plain block city like Git City).
- Override height from the financial metric (the accurate, legible channel).
- For footprint-as-headcount, either scale the real footprint by a metric-driven factor, or substitute a normalized abstract pad when the real polygon is tiny/odd. Reserve full abstraction only for companies with no usable OSM footprint.

## 5. Color

- Use perceptually uniform, colorblind-safe sequential ramps (**viridis** or **cividis**) for any ordinal metric; their differentiator is lightness, which survives all CVD types ([colorblind.io](https://colorblind.io/guides/data-visualization), [Datanovia](https://www.datanovia.com/en/blog/top-r-color-palettes-to-know-for-great-data-visualization/)).
- For categorical sector color, use the **Wong 8-color palette** (Nature Methods) or a ColorBrewer qualitative scheme, capped at <= 8 categories with a labeled legend ([colorblind-safe palettes](https://colorblind.io/guides/colorblind-safe-palettes)).
- Do not rely on hue for fine magnitude (weakest channel). Avoid red/green as the sole growth signal.
- **Dark "night city"** aesthetic recommended for MVP: it fits the ecosystem-energy narrative, lets emissive "revenue windows" glow read against a dark base, and maximizes contrast for bright ramps. Keep the basemap (streets, water, ground) desaturated so only the buildings carry saturated/bright color.

## 6. Recommended MVP encoding spec

| Metric | Channel | Scale | Range / palette |
|---|---|---|---|
| Funding raised | Height | `scalePow().exponent(0.3).clamp(true)`; log toggle for expert mode | floor ~3 stories ($0 still visible) to a capped max tower |
| Headcount | Footprint area / mass | `scaleSqrt` (value to area) | ~0.6x to ~1.6x of real footprint |
| Valuation | Color brightness | `scaleSequential` (quantile-clamped) | viridis or cividis |
| Revenue | Emissive window intensity | thresholded / `scaleSqrt` | dark (pre-revenue) to bright glow |
| Sector (optional) | Hue (categorical) | n/a | Wong 8-color, <= 8 categories |

Non-negotiable legibility scaffolding for the MVP: hover/click numeric readout of all four metrics; persistent 2D legend; ranked "Top by funding" side panel; orthographic compare-mode camera plus constrained pitch/zoom; dark night-city base with desaturated ground; real OSM footprints with overridden height and headcount-scaled footprint (abstract pad only when no usable polygon exists).

## Strategic caveat (flagged)

Every serious data-viz source says 3D wrecks precise magnitude comparison. Capline's value is the experience (a walkable city of the local economy), not pixel-accurate comparison. Lean into the city metaphor for engagement, and treat the readouts, ranked list, and orthographic mode as the things that make it also a usable chart. Do not try to make the 3D scene itself precise; make the scaffolding around it precise.

### Sources
[Cleveland and McGill](https://creativeartsadventure.wordpress.com/2017/01/02/cleveland-mcgill-graphical-perception-theory-experimentation-and-application-to-the-development-of-graphical-methods/) ·
[UW CSE412 Perception](https://courses.cs.washington.edu/courses/cse412/21sp/lectures/CSE412-Perception1.pdf) ·
[Stanford CS448B](https://hci.stanford.edu/courses/cs448b/f09/lectures/CS448B-20091005-Perception.pdf) ·
[Lost in Magnitudes (arXiv)](https://arxiv.org/pdf/2404.15150) ·
[Linear vs log](https://www.syncfusion.com/blogs/post/linear-vs-logarithmic-scales-in-chart) ·
[d3-scale](https://www.npmjs.com/package/d3-scale) ·
[d3 in depth scales](https://www.d3indepth.com/scales/) ·
[Stevens power law](https://santhoshsoundar.blog/power-law/) ·
[Domo 3D charts](https://www.domo.com/learn/charts/3d-charts) ·
[Highcharts 3D](https://www.highcharts.com/blog/best-practices/3d-graph-useful-visualization-or-misleading-illusion/) ·
[colorblind.io data-viz](https://colorblind.io/guides/data-visualization) ·
[colorblind-safe palettes](https://colorblind.io/guides/colorblind-safe-palettes) ·
[Datanovia palettes](https://www.datanovia.com/en/blog/top-r-color-palettes-to-know-for-great-data-visualization/) ·
[MapLibre fill-extrusion](https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/) ·
[MapLibre style spec](https://maplibre.org/maplibre-style-spec/layers/) ·
[git-city](https://github.com/srizzon/git-city)
