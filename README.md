# @magic-spells/morph-engine

**~11 KB** gzipped

Shared-element morph engine. A spring-driven `<morph-blob>` measures the element you clicked, morphs its rect, corner radii, background, border and shadow into a target element's, and reveals the target in lockstep with the blob's geometry — so the real element inherits the spring's settle. UI grows out of what you clicked, macOS-genie style.

Built on [@magic-spells/physics-engine](https://www.npmjs.com/package/@magic-spells/physics-engine) (spring timing) and [@magic-spells/frame-engine](https://www.npmjs.com/package/@magic-spells/frame-engine) (keyframe interpolation with extrapolation — spring overshoot becomes geometry bounce for free).

🔍 **[Live Demo](https://magic-spells.github.io/morph-engine/demo/)** - See it in action!

## Install

```bash
npm install @magic-spells/morph-engine
```

```html
<!-- or UMD, self-contained (bundles both engines) -->
<script src="https://unpkg.com/@magic-spells/morph-engine"></script>
```

## Quick start

```js
import { MorphEngine } from '@magic-spells/morph-engine';

const morph = new MorphEngine();

// panel grows out of the card
await morph.show({ from: cardElement, to: panelElement });

// panel shrinks back into the card (re-measures both — scroll-safe)
await morph.hide();
```

Calling `hide()` mid-show (or `show()` mid-hide) reverses the spring from wherever it is — interruption needs no special handling.

## Options

```js
new MorphEngine({
	attraction: 0.1,         // spring attraction, (0, 1) exclusive — higher = faster
	friction: 0.32,          // spring friction, (0, 1) exclusive — lower = bouncier
	revealAt: 0.75,          // progress where the target reveal window begins
	sourceRevealUntil: 0.25, // progress where the source reveal window ends (mirrors revealAt at the p→0 end)
	cloneFadeUntil: 0.25,    // progress where the source-content clone finishes dissolving
	cloneContents: true,     // clone the source's content into the blob
	cloneFit: 'freeze',      // 'freeze' | 'scale' | 'reflow' — how the clone is sized as the blob resizes
	handoff: 'fade',         // 'fade' | 'hard' — how the blob hands off to the target
	hide: {                  // sparse overrides for the hide leg
		attraction: 0.18,
		friction: 0.5
	},
	lockScroll: true,        // lock body scroll from show until fully hidden
	zIndex: 9999,            // blob z-index
	styleProperties: [...]   // computed styles to capture and morph (camelCase longhands)
});
```

## Animating in and out differently

The show leg and the hide leg are the same routine with the roles swapped, but they don't have to
feel the same. Eight settings are **directional** — they can be set once for both legs, overridden
for the hide leg, or overridden per call:

| Key                 | Effect                                                                                                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `attraction`        | Spring attraction, (0, 1) exclusive — higher = faster                                                                                                                                                           |
| `friction`          | Spring friction, (0, 1) exclusive — lower = bouncier                                                                                                                                                            |
| `revealAt`          | Progress where the destination's reveal window begins                                                                                                                                                           |
| `sourceRevealUntil` | Progress where the origin's reveal window ends                                                                                                                                                                  |
| `cloneFadeUntil`    | Progress where the origin-content clone finishes dissolving                                                                                                                                                     |
| `cloneContents`     | Whether the origin's content is cloned into the blob at all                                                                                                                                                     |
| `cloneFit`          | `'freeze'` (default) keeps the clone at the origin's pixel size; `'scale'` scales it with the blob's border box; `'reflow'` lays it out at the blob's size (fluid children follow the box, text keeps its size) |
| `handoff`           | `'fade'` (default) ramps the destination in then fades the blob out; `'hard'` swaps both in one instant at `revealAt`                                                                                           |

Three places to set them, resolved per run in this order (later wins, `undefined` never overrides):

```js
const morph = new MorphEngine({
	// 1. base — used by both legs
	attraction: 0.1,
	friction: 0.32,

	// 2. hide bag — sparse, overlays the base on the hide leg only
	hide: {
		attraction: 0.18, // snap home faster than it opened
		friction: 0.5, // and land without the bounce
		revealAt: 0.6, // show the card again earlier on the way back
	},
});

// 3. per-call — one-off, wins over both
await morph.show({ from: card, to: panel, attraction: 0.06 }); // this one drifts open
await morph.hide({ friction: 0.8 }); // this one lands dead
```

A common shape: a soft, slightly overshooting open and a quick, damped close.

```js
new MorphEngine({
	attraction: 0.08,
	friction: 0.28,
	hide: { attraction: 0.2, friction: 0.55 },
});
```

Both bags are sparse — `hide: { attraction: 0.18 }` inherits the base `friction`, reveal windows
and clone settings untouched.

### Changing values later

`hideConfig` is a public field, so the hide leg can be retuned at any time:

```js
morph.hideConfig.attraction = 0.25; // future hides only
morph.hideConfig = {}; // hide now matches show again
```

`setAttraction()` / `setFriction()` apply live to the running spring **and** update the
show/default dial used by future flights. They do not touch `hideConfig` — a hide-leg override
still wins on the way back. The plain choreography fields (`revealAt`, `sourceRevealUntil`,
`cloneFadeUntil`, `cloneContents`, `cloneFit`, `handoff`) are public properties too, and are read
fresh at the start of each run:

```js
morph.setAttraction(0.15); // show/default dial + the live spring
morph.cloneContents = false; // from the next flight on
```

### Photo / continuous morph

The defaults are tuned for panels growing out of buttons: the frozen clone dissolves early, the
destination ramps in under the blob, then the blob fades away. For a photo — a thumbnail growing
into a full-size version of the same picture — that reads as fade-out, empty box, fade-in. Two
settings turn it into one continuous zoom:

```js
await morph.show({
	from: thumbnail,
	to: fullImage,
	cloneFit: 'scale', // the frozen picture scales with the blob instead of freezing
	cloneFadeUntil: Infinity, // ...and never dissolves — `Infinity` is the "never" value
	revealAt: 0.9, // hand off late, once the geometry is basically there
	oneWay: true,
});
```

`cloneFit` and fading are orthogonal: `cloneFadeUntil: Infinity` holds the clone at full opacity
for the whole flight, so the picture is visible the entire way. By `revealFull` the real image is
opaque _underneath_, and the blob (clone included) then fades over an identical opaque layer —
no translucency dip.

For a crisper swap — useful when the thumbnail is cover-cropped to a different aspect ratio, so
the scaled clone and the real image don't line up exactly — collapse the crossfade into a single
frame instead:

```js
await morph.show({
	from: thumbnail,
	to: fullImage,
	cloneFit: 'scale',
	cloneFadeUntil: Infinity,
	handoff: 'hard',
	revealAt: 0.5, // blob out, target in, at the halfway point
	oneWay: true,
});
```

`handoff: 'hard'` sets the destination's opacity ramp to zero width and replaces the blob's fade
with a step, both at `revealAt`. The switch point is clamped strictly inside `(0, 1)`, so
`revealAt: 0` and `revealAt: 1` land a hair inside the flight rather than colliding with its end
keyframes.

### Card / mixed-content morph

`'scale'` stretches everything in the clone by the blob's width and height ratios. That is right
for one bitmap and wrong for a card: a caption under a photo is 13px on both ends of the flight,
so a scaled clone paints it at 36px mid-flight and its picture lands short of the real one by
the caption's share of the card. `cloneFit: 'reflow'` sizes the clone's wrapper to the blob
instead, so the clone lays itself out at every size the blob passes through — fluid children
(a `width: 100%` picture) follow the box, fixed-size children (text, padding, borders) keep
theirs — exactly how the destination lays out the same markup:

```js
await morph.show({
	from: card,
	to: fullCard,
	cloneFit: 'reflow',
	cloneFadeUntil: Infinity,
	revealAt: 0.9,
	oneWay: true,
});
```

Once the blob is within a couple percent of the destination box, the clone is laid out
**once** at that size and only transformed by a near-1 scale for the rest of the spring
(overshoot included), so the settle never triggers layout and nothing fixed-size pops at the
switch — the clone's layout at handoff is the destination's within the latch tolerance. It
latches on proximity rather than on `revealAt`, and unlatches only past a wider tolerance, so
a reversal returns to per-frame layout without flapping at the boundary. Costs one layout of
the clone's subtree per frame until it latches; the blob's own box is laid out per frame in
every mode. The clone must be able to lay itself out at other sizes:
pin the origin's fluid children with relative sizes (`width: 100%`, `aspect-ratio`) rather
than pixels.

An unrecognized `cloneFit` or `handoff` value warns and falls back to the default.

### Reversals

Calling `hide()` mid-show retunes the spring to the hide dials immediately, from wherever the
spring is — so an interrupted open still closes with the hide feel. The interrupted flight keeps
its original reveal and clone choreography, because those windows are anchored to the keyframes
already in flight; only the spring dials change direction.

## API

| Member                                                | Description                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `show({ from, to, display?, oneWay?, ...overrides })` | Morph from → to. Resolves `true` on settle, `false` if superseded. `display` is applied if `to` is `display: none` at measure time. `oneWay: true` completes automatically after `shown`. `...overrides` accepts any of the eight directional keys.                                                                   |
| `hide({ ...overrides }?)`                             | Morph back (remembers the pair, re-measures both). Same promise semantics and the same one-off overrides; no-argument `hide()` remains supported.                                                                                                                                                                     |
| `complete({ restoreSource? })`                        | Permanently hand a shown/showing flight to the target. The target keeps its inline visible/display state and loses `morph-shown`; the engine returns to `idle`. By default the source stays hidden because the app now owns or destroys it. `restoreSource: true` restores it instead. Returns a boolean.             |
| `stop({ restoreSource? })`                            | Abort and restore both elements to their pre-show resting state. `restoreSource: false` makes it a **handoff** instead — the blob goes and the target is restored, but the source stays hidden and keeps its `morphing` mark, because a morph still owns it. Use it when another animation is taking the flight over. |
| `restoreSource()`                                     | Restore a source held back by `stop({ restoreSource: false })`. Idempotent, safe on a detached element, and called automatically by `show()` and `destroy()` so a held source never leaks into a later flight. Returns `true` when it restored something.                                                             |
| `destroy()`                                           | `stop()` + `restoreSource()` + remove all listeners.                                                                                                                                                                                                                                                                  |
| `setAttraction(n)` / `setFriction(n)`                 | Live spring tuning that also updates the show/default setting. Does not touch `hideConfig`.                                                                                                                                                                                                                           |
| `hideConfig`                                          | Mutable sparse bag of hide-leg overrides (the constructor's `hide` option).                                                                                                                                                                                                                                           |
| `state`                                               | `'idle' \| 'showing' \| 'shown' \| 'hiding'`                                                                                                                                                                                                                                                                          |
| `progress`                                            | Last-known progress (overshoots past 1 while settling).                                                                                                                                                                                                                                                               |

## Events

`on(event, fn)` / `off(event, fn)` — payloads carry the logical `{ from, to }` pair.

| Event                 | When                                                                                                                                                                                                                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `show` / `hide`       | Morph starts (including a mid-flight reversal).                                                                                                                                                                                                                                                                |
| `change`              | Every frame — `{ progress, phase }`.                                                                                                                                                                                                                                                                           |
| `reveal` / `unreveal` | The run's destination element starts/stops painting — `{ from, to }` in run orientation. Fires at the reveal boundary while the destination is still at opacity 0, which makes `reveal` the seam-free moment for layer promotion (e.g. `dialog.showModal()`; promoting at `shown` repaints a visible surface). |
| `shown` / `hidden`    | Spring settled.                                                                                                                                                                                                                                                                                                |
| `stop`                | `stop()` was called — `{ progress }`.                                                                                                                                                                                                                                                                          |
| `complete`            | A completed handoff — `{ from, to }`. This event is never reported as `stop`.                                                                                                                                                                                                                                  |

## Concurrency

A `MorphEngine` is intentionally single-flight. For N simultaneous morphs, use N engine instances
or `MorphGroup`; the module-level body lock is refcounted, so the original body overflow is restored
only after the final holder releases it. Use one engine per concurrent flight and never share an
element between engines. Concurrent blobs with the same `zIndex` stack by DOM order, so assign
different z-index values when their visual order matters.

## MorphGroup

`MorphGroup` pools one engine per pair index, fans lifecycle methods out, and emits aggregate
`shown`, `hidden`, and `complete` events when the last participating engine reaches that state.
`show()` resolves `true` only when every flight settles; `stop()` or `destroy()` cancels launches
that are still waiting in the stagger window. Both `show()` and `hide()` take `stagger`
(milliseconds between launches) — a **negative stagger runs the set in reverse order** (last item
first), same convention as timeline-engine, so a group can fly home in the opposite order it
arrived: `group.hide({ stagger: -60 })`.

The constructor options — including the `hide` bag — go to every pooled engine, and any
directional key left over on `show()`/`hide()` after `stagger`, `oneWay` and `display` are peeled
off is forwarded as a per-call override to each engine, so a group animates in and out with
different spring feels the same way a single engine does.

```js
import { MorphGroup } from '@magic-spells/morph-engine';

const group = new MorphGroup({
	friction: 0.35,
	hide: { friction: 0.45 },
});

const pairs = cards.map((from, index) => ({
	from,
	to: slots[index],
	display: 'grid',
}));

await group.show(pairs, { stagger: 40, oneWay: true, attraction: 0.09 });

group.engines; // inspect the pooled engines
await group.hide({ stagger: -40 }); // fly home in reverse order
group.stop(options); // cancel delayed launches and stop live flights
group.completeAll(options);
group.destroy();
```

`group.state` is advisory: it is `idle` when every pooled engine is idle, otherwise it reports an
active phase (or `shown`). A group is a shared trigger, deliberately not a scrub-able timeline—spring
flights have no closed-form position-at-time.

## Styling hooks

- The blob is an unregistered `<morph-blob>` element — style it via the tag if needed.
- During flight both elements carry `morphing="source"` / `morphing="target"`.
- While shown, the target carries `morph-shown` and the source stays hidden (it "became" the target).

## Rules for morph targets

- Hide resting targets with `visibility: hidden` — **never set `opacity` in the stylesheet** (the engine drives inline opacity during the reveal and clears it afterwards).
- Don't position targets with their own CSS `transform` (e.g. `translate(-50%, -50%)` centering) — the engine owns `transform` during the reveal. Center with `inset: 0; margin: auto` instead.
- Avoid `transition` rules that cover opacity/transform on morph elements; the engine writes `transition: none` inline during flight as insurance.

## Current limitations (PoC)

- `box-shadow`: first shadow only, sRGB colors.
- `background-color` interpolates (rgba alpha included). `backdrop-filter` and `background-image` (with size/repeat/position) are captured and applied **statically** to the blob — target-else-source, never interpolated — so glass and textured surfaces survive the flight; the residual is a translucent double-composite seam during the reveal window.
- Sources/targets inside `display: none` ancestors can't be measured.
- Velocity isn't carried across a mid-flight reversal (needs a velocity readout in physics-engine — planned).
- `cloneFit: 'scale'` scales the clone to the blob's **border box**, so a source with a visible
  border or padding will see that chrome scale with the content — use it on borderless surfaces
  (photos, flush media) where the clone fills the box. `'reflow'` is the mode for anything with
  text or chrome in it.
- `cloneFit: 'reflow'` is exact when the origin and the destination lay the same markup out the
  same way at their two sizes (fluid pictures, fixed text); a destination that changes the
  layout rules (a caption moved out of flow, a different font size) still lands on it, but the
  clone shows the origin's layout on the way.
- Native `<dialog>`/popover top layer paints above the blob — fly them in normal flow and promote on the `reveal` event (destination is still at opacity 0 there; the demo's modal-handoff section is the reference pattern), or wait for the planned popover-API blob.

## Demo

```bash
npm run dev   # http://localhost:3011
```

Task cards that grow into a detail panel, a dropdown that grows out of its trigger, two real `<dialog>` handoffs (a card and a pill that land modal via the `reveal`-point `showModal()` pattern), and live spring-tuning sliders.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made by <a href="https://github.com/coryschulz">Cory Schulz</a>
</p>
