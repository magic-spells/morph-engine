# Changelog

## 0.4.2

### Added

- **`container`** — where the `<morph-blob>` is appended for a flight: an `Element` or a
  function returning one (called once per flight), as a constructor option and as a per-call
  override on `show()` (per-call wins; the hide leg flies in the same container as its show).
  Default `document.body`, so nothing changes unless you set it. A fixed blob in body paints
  under the browser top layer, which made any flight whose destination sits inside an open
  `showModal()` dialog invisible; a container inside that dialog's subtree puts the blob in the
  same layer. `lockScroll` still locks `document.body`, and `zIndex` keeps its number semantics
  but now competes with the container's children.
- When the container (or an ancestor) is a containing block for fixed descendants — `transform`,
  `filter`, `backdrop-filter`, `perspective`, `contain: paint | layout`, `will-change:
transform` — the blob's `top`/`left` would be relative to that box rather than the viewport.
  The engine probes where a `top: 0; left: 0` blob actually lands inside the container once
  per flight and subtracts that offset, so a `transform`-centred dialog needs no extra care. A
  scaled or rotated containing block still scales or rotates the blob with it (documented).

## 0.4.1

### Fixed

- **Modern color syntaxes no longer break the blob's border.** Computed border/background
  colors are normalized to `rgba()` at capture (`src/color.js`: oklab, oklch, lab, lch,
  `color(srgb | srgb-linear | display-p3)`, hsl, hex, `transparent`). Chrome serializes a
  Tailwind v4 opacity modifier — `border-border/60`, i.e. `color-mix(in oklab, …)` — as
  `oklab(L a b / α)`, which frame-engine does not recognize as a color: paired with a plain
  `rgb()` at the other end it interpolated to `rgb(NaN,NaN,NaN)`, an invalid value the CSSOM
  drops, leaving the blob's border at its `currentColor` fallback — an opaque white hairline
  for the entire flight on a dark theme.
- **The blob starts with no border at all** (`border-width: 0`, `border-color: transparent`)
  instead of `border-style` alone, which computes to `medium solid currentColor`. Any frame
  with a missing or invalid border longhand now degrades to no border, never a white one.
- **`parseShadow` takes the first VISIBLE OUTER shadow**, not literally the first. Tailwind
  shadow utilities serialize a list whose leading entries are placeholder `rgba(0, 0, 0, 0)`
  rings and an inset lip, so the morph was flying a fully transparent shadow while the real
  contact shadow was ignored.

### Added

- `npm test` — node:test coverage for the pure helpers (`test/*.test.mjs`), including the exact
  computed strings Chromium produces for the Pyramid board's card and task panel.

## 0.4.0

### Added

- **`cloneFit: 'reflow'`**, a third clone sizing mode next to `'freeze'` and `'scale'`. The
  clone's wrapper is sized to the blob every frame, so the clone lays itself out at each size
  the blob passes through: fluid children follow the box, fixed-size children (text, padding,
  borders) keep their size — the layout the destination will have, instead of a stretched
  bitmap of the origin. Once the blob is within a couple percent of the destination box, the
  clone is laid out once at that size and rides the rest of the spring (overshoot included) on
  a near-1 scale transform, so the settle never triggers layout and the handoff matches the
  destination within the latch tolerance. Directional like
  the other choreography keys: constructor option, public field, `hide` bag, per-call override.
  Pin the origin's fluid children with relative sizes (`width: 100%`, `aspect-ratio`) so the
  clone can lay itself out at other sizes.

### Notes

- No behaviour change with default options. `'scale'` is unchanged.
- This is the last 0.x feature release before 1.0.0; the three `cloneFit` names are final.

## 0.3.0

### Added

- **`cloneFit: 'freeze' | 'scale'`** (default `'freeze'`, today's behaviour). `'scale'` scales the
  frozen source clone to the blob's border box every frame from a `0 0` origin instead of holding
  it at the source's pixel size, so a photo keeps growing rather than dissolving. Combine with
  `cloneFadeUntil: Infinity` — the documented "never dissolve" value — for a continuous morph
  with no empty-box phase.
- **`handoff: 'fade' | 'hard'`** (default `'fade'`, today's behaviour). `'hard'` collapses the
  destination's opacity ramp and the blob's fade into a single instant at `revealAt`, for a clean
  switch when the two ends don't line up pixel-for-pixel (cover-cropped thumbnails).

Both are directional and sparse like the existing choreography keys: constructor option, public
field read fresh per flight, `hide` bag override, and per-call override on `show()` / `hide()`.
`MorphGroup` forwards them unchanged.

### Notes

- `cloneFit: 'scale'` scales to the blob's **border box** — use it on borderless surfaces.
- No behaviour change with default options.
