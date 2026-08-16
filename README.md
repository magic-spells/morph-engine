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
feel the same. Six settings are **directional** — they can be set once for both legs, overridden
for the hide leg, or overridden per call:

| Key                 | Effect                                                            |
| ------------------- | ----------------------------------------------------------------- |
| `attraction`        | Spring attraction, (0, 1) exclusive — higher = faster             |
| `friction`          | Spring friction, (0, 1) exclusive — lower = bouncier              |
| `revealAt`          | Progress where the destination's reveal window begins             |
| `sourceRevealUntil` | Progress where the origin's reveal window ends                    |
| `cloneFadeUntil`    | Progress where the origin-content clone finishes dissolving       |
| `cloneContents`     | Whether the origin's content is cloned into the blob at all       |

Three places to set them, resolved per run in this order (later wins, `undefined` never overrides):

```js
const morph = new MorphEngine({
	// 1. base — used by both legs
	attraction: 0.1,
	friction: 0.32,

	// 2. hide bag — sparse, overlays the base on the hide leg only
	hide: {
		attraction: 0.18, // snap home faster than it opened
		friction: 0.5,    // and land without the bounce
		revealAt: 0.6     // show the card again earlier on the way back
	}
});

// 3. per-call — one-off, wins over both
await morph.show({ from: card, to: panel, attraction: 0.06 }); // this one drifts open
await morph.hide({ friction: 0.8 });                          // this one lands dead
```

A common shape: a soft, slightly overshooting open and a quick, damped close.

```js
new MorphEngine({
	attraction: 0.08,
	friction: 0.28,
	hide: { attraction: 0.2, friction: 0.55 }
});
```

Both bags are sparse — `hide: { attraction: 0.18 }` inherits the base `friction`, reveal windows
and clone settings untouched.

### Changing values later

`hideConfig` is a public field, so the hide leg can be retuned at any time:

```js
morph.hideConfig.attraction = 0.25;   // future hides only
morph.hideConfig = {};                // hide now matches show again
```

`setAttraction()` / `setFriction()` apply live to the running spring **and** update the
show/default dial used by future flights. They do not touch `hideConfig` — a hide-leg override
still wins on the way back. The plain choreography fields (`revealAt`, `sourceRevealUntil`,
`cloneFadeUntil`, `cloneContents`) are public properties too, and are read fresh at the start of
each run:

```js
morph.setAttraction(0.15);    // show/default dial + the live spring
morph.cloneContents = false;  // from the next flight on
```

### Reversals

Calling `hide()` mid-show retunes the spring to the hide dials immediately, from wherever the
spring is — so an interrupted open still closes with the hide feel. The interrupted flight keeps
its original reveal and clone choreography, because those windows are anchored to the keyframes
already in flight; only the spring dials change direction.

## API

| Member                                              | Description                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `show({ from, to, display?, oneWay?, ...overrides })` | Morph from → to. Resolves `true` on settle, `false` if superseded. `display` is applied if `to` is `display: none` at measure time. `oneWay: true` completes automatically after `shown`. `...overrides` accepts any of the six directional keys.                                                                       |
| `hide({ ...overrides }?)`                           | Morph back (remembers the pair, re-measures both). Same promise semantics and the same one-off overrides; no-argument `hide()` remains supported.                                                                                                                                                                     |
| `complete({ restoreSource? })`                      | Permanently hand a shown/showing flight to the target. The target keeps its inline visible/display state and loses `morph-shown`; the engine returns to `idle`. By default the source stays hidden because the app now owns or destroys it. `restoreSource: true` restores it instead. Returns a boolean.             |
| `stop({ restoreSource? })`                          | Abort and restore both elements to their pre-show resting state. `restoreSource: false` makes it a **handoff** instead — the blob goes and the target is restored, but the source stays hidden and keeps its `morphing` mark, because a morph still owns it. Use it when another animation is taking the flight over. |
| `restoreSource()`                                   | Restore a source held back by `stop({ restoreSource: false })`. Idempotent, safe on a detached element, and called automatically by `show()` and `destroy()` so a held source never leaks into a later flight. Returns `true` when it restored something.                                                             |
| `destroy()`                                         | `stop()` + `restoreSource()` + remove all listeners.                                                                                                                                                                                                                                                                  |
| `setAttraction(n)` / `setFriction(n)`               | Live spring tuning that also updates the show/default setting. Does not touch `hideConfig`.                                                                                                                                                                                                                           |
| `hideConfig`                                        | Mutable sparse bag of hide-leg overrides (the constructor's `hide` option).                                                                                                                                                                                                                                           |
| `state`                                             | `'idle' \| 'showing' \| 'shown' \| 'hiding'`                                                                                                                                                                                                                                                                          |
| `progress`                                          | Last-known progress (overshoots past 1 while settling).                                                                                                                                                                                                                                                               |

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
	hide: { friction: 0.45 }
});

const pairs = cards.map((from, index) => ({
	from,
	to: slots[index],
	display: 'grid'
}));

await group.show(pairs, { stagger: 40, oneWay: true, attraction: 0.09 });

group.engines;                    // inspect the pooled engines
await group.hide({ stagger: -40 }); // fly home in reverse order
group.stop(options);       // cancel delayed launches and stop live flights
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
