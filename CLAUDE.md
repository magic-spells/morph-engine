# @magic-spells/morph-engine

## Purpose

Shared-element morph engine ("container transform"). A fixed-position `<morph-blob>` springs from a source element's rect + captured styles to a target's, dissolving a frozen clone of the source's content on the way out and revealing the target — mirrored to the blob's geometry — on the way in. Wraps physics-engine (spring timing, owns the rAF loop) and frame-engine (keyframe → styles, extrapolates on overshoot).

## Key files

- `src/morph-engine.js` — the entire engine (single class `MorphEngine extends EventEmitter` + module-level shadow-lerp helpers)
- `src/event-emitter.js` — vendored copy of physics-engine's EventEmitter
- `demo/index.html` — dark demo: task cards → detail panel, dropdown trigger → options, Parameter Lab sliders (script tag carries a `?v=N` query — bump it if the browser serves a stale dev build)
- `scripts/build.mjs` — Vite 8/rolldown build (split-panel pattern, no CSS): ESM externalizes the two engine deps; UMD bundles them (global `MorphEngine`, so the class is `MorphEngine.MorphEngine`)

## Commands

- `npm run dev` — watch build to `demo/dist/` + dev server at http://localhost:3011
- `npm run build` — prod build to `dist/` (ESM + min UMD)
- `npm run lint` / `npm run format`

## Architecture

1. **One routine, two directions.** `show(from→to)` and `hide(to→from)` run the same `#morph()` with roles swapped — no bespoke cover phase on hide. The blob starts pixel-identical to its from-element (frozen `cloneNode` of its content in a fixed-size wrapper on top), so inline-hiding the real element at p=0 is invisible.
2. **Everything is a pure function of `p = position / 1000`** — never the spring event's `progress` field, which is relative to each `animateTo()`'s endpoints and resets on retarget. Reveal handling is an idempotent per-frame check (`p >= revealAt ? ensureRevealed() : ensureUnrevealed()`), which is what makes mid-flight reversal need zero special-casing.
3. **Reveal windows at both ends.** Target window `[revealAt, 1]`: the target is made visible and per-frame mirrored to the blob's interpolated rect via `transformOrigin: '0 0'` + translate/scale. Target opacity ramps over the first half of the window, blob opacity fades over the second half (sparse frame-engine keyframe `{revealFull: 1, blobClear: 0}` where blobClear is the midpoint of `[revealFull, 1]` — clearing before the spring's slow tail so the blob never sits as a translucent slab muting the target's content; opacity clamps during extrapolation), so the surface never dips translucent. The boundary emits `reveal`/`unreveal` — the destination is at opacity 0 there, the seam-free moment for top-layer promotion (`showModal()` at `shown` visibly repaints the settled surface; the demo's modal handoff promotes on `reveal`). During overshoot (p > 1) the blob is clamped invisible and the target itself carries the bounce through its mirror transform. The source end mirrors this over `[0, sourceRevealUntil]`: the real from-element fades in under the blob (outer half of the window) while the blob fades out (inner half), so a morph **reversed back to closed** crossfades to the live current element instead of hard-swapping a stale full-opacity replica. Both windows are pure functions of `p` with idempotent ensure/unensure pairs — no direction special-casing; a fresh show simply fades the blob in over the pixel-identical source.
4. **Longhands only in keyframes** — frame-engine snaps multi-value shorthands (`border`, `borderRadius`, `boxShadow`) discretely. Radii/border widths/colors are captured as longhands; box-shadow is a manual first-shadow lerp (`parseShadow`/`lerpShadow`) at raw p. `backdrop-filter` and `background-image` (+ size/repeat/position) have no meaningful midpoint, so they're captured but applied **statically** to the blob (`#createBlob`, target-else-source), never keyframed — `background-color` still interpolates, rgba alpha included. Border colors are **reconciled** before keyframing (`#reconcileBorderColors`): an absent border (style `none`/zero widths) computes its color as currentColor and `transparent` computes as rgba(0,0,0,0), so a degenerate end would drag the visible border through an unrelated hue — instead an absent end holds the visible end's color verbatim (width does the vanishing) and a fully transparent end holds the visible hue at alpha 0.
5. **Post-clamp** width/height/radii/border-widths ≥ 0 every frame — frame-engine extrapolates them negative during hide-direction overshoot (invalid CSS, frame stall).
6. **The engine owns its promises.** physics-engine resolves a superseded `animateTo` promise silently, so each run gets its own promise via `#resolveRun`; superseded runs resolve `false`, settled runs `true`. Settle finalizes by *state* ('showing' → shown, 'hiding' → idle) — reversals flip state and target position together (`#shownPosition` tracks which spring end means "shown", so double reversals work). **Early finalize:** once the spring is sub-pixel from its target (`|pos − target| < 1`) for two consecutive change events with a per-frame delta `< 0.5`, the engine snaps to the exact end frame, `stop()`s the spring and settles — skipping physics-engine's ~0.5s post-motion tail (it only fires `complete` at `< 1e-2`). The per-frame-delta guard preserves the overshoot bounce (the first target crossing has a large delta and never qualifies); the spring's later `stop`/`complete` is inert because nothing listens to spring `stop` and `#settle` is state-guarded.
7. **Inline-style bookkeeping**: everything the engine writes on real elements (`MANAGED_PROPERTIES`) is saved once per show→hide lifecycle and fully restored at hidden/stop — after a complete cycle both elements have zero stray inline styles. The source stays `visibility: hidden` while shown (it "became" the target). Body scroll is locked (`lockScroll`, default true) from show until fully hidden.
8. **Source retarget on hide** (`hide({ from })`, ≥0.2.0). Honored only from the `'shown'` state (ignored mid-reversal — a reversal must return to the original source). When `from !== #sourceElement`, `#retargetSource` fully restores the outgoing source (`#restoreInline` restore-and-**delete** so the retargeted-away element can never leak a saved-style entry into a later `stop()`/finalize) and takes over the incoming one with show()'s exact bookkeeping (`#saveInline` + `visibility: hidden`), then repoints `#sourceElement`; `#morph(target, newSource, 'hiding')` re-measures and reveals the new element at the p→1 end. The hide-flight clone is `#fromMeasure.element` = the **target**, so retargeting the source doesn't touch it. Argless `hide()` is 100% unchanged.

## Gotchas

- Morph targets must be resting-hidden with `visibility: hidden` and must NOT have stylesheet `opacity` or transform-based positioning (engine drives inline `opacity`/`transform`; demo centers the panel with `inset: 0; margin: auto`).
- The spring lives on rAF — Chrome pauses rAF for occluded windows, freezing a morph mid-flight until the window is visible again (it resumes cleanly; timeDelta is capped upstream).
- Two engines must not share an element concurrently — saved inline styles would cross-contaminate.
- `hide({ from })` retargets **only** from `'shown'`; passing `from` during a reversal (`'showing'`) is silently ignored by design. A retargeted `from` must be a real, laid-out element (it's set `visibility: hidden` then measured) — it inherits the same target constraints as a `show()` source.
- `deps`: both `@magic-spells/physics-engine` and `@magic-spells/frame-engine` are real npm deps (published 1.0.0). The ESM build externalizes them; UMD bundles them.
- No test suite (repo convention) — verify via the demo. A deterministic trick that works well: shim `requestAnimationFrame` with a fake-time pump in the console and drive the whole lifecycle synchronously.

## Future work (agreed scope cuts)

select-dropdown retrofit; Pyramid integration; velocity exposure in physics-engine for momentum-preserving reversals; boxShadow support in frame-engine; popover-API top-layer blob; oklch capture (static gradient/image capture shipped); multi-spring liquid feel.
