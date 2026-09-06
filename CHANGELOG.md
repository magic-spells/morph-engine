# Changelog

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
