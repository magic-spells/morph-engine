# Changelog

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
