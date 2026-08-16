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

`hide` accepts sparse overrides for `attraction`, `friction`, `revealAt`,
`sourceRevealUntil`, `cloneFadeUntil`, and `cloneContents`. The same keys can be passed to
`show()` or `hide()` for a one-off flight. Precedence is per-call override → hide bag (hide leg
only) → top-level/public field. Undefined values never override, so live mutations such as
`morph.cloneContents = false` keep flowing through.

`setAttraction()` and `setFriction()` apply live to the current spring and update the show/default
settings used by future flights. A reversal immediately retunes the spring for its new direction;
the interrupted flight keeps its original reveal and clone choreography.

## API

| Member                                              | Description                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `show({ from, to, display?, oneWay?, ...overrides })` | Morph from → to. Resolves `true` on settle, `false` if superseded. `display` is applied if `to` is `display: none` at measure time. `oneWay: true` completes automatically after `shown`.                                                                                                                              |
| `hide({ ...overrides }?)`                           | Morph back (remembers the pair, re-measures both). Same promise semantics; no-argument `hide()` remains supported.                                                                                                                                                                                                    |
| `complete({ restoreSource? })`                      | Permanently hand a shown/showing flight to the target. The target keeps its inline visible/display state and loses `morph-shown`; the engine returns to `idle`. By default the source stays hidden because the app now owns or destroys it. `restoreSource: true` restores it instead. Returns a boolean.             |
| `stop({ restoreSource? })`                          | Abort and restore both elements to their pre-show resting state. `restoreSource: false` makes it a **handoff** instead — the blob goes and the target is restored, but the source stays hidden and keeps its `morphing` mark, because a morph still owns it. Use it when another animation is taking the flight over. |
| `restoreSource()`                                   | Restore a source held back by `stop({ restoreSource: false })`. Idempotent, safe on a detached element, and called automatically by `show()` and `destroy()` so a held source never leaks into a later flight. Returns `true` when it restored something.                                                             |
| `destroy()`                                         | `stop()` + `restoreSource()` + remove all listeners.                                                                                                                                                                                                                                                                  |
| `setAttraction(n)` / `setFriction(n)`               | Live spring tuning that also updates the show/default setting.                                                                                                                                                                                                                                                        |
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

await group.show(pairs, { stagger: 40, oneWay: true });

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
