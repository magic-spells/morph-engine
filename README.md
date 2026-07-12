# @magic-spells/morph-engine

**~8 KB** gzipped

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
	lockScroll: true,        // lock body scroll from show until fully hidden
	zIndex: 9999,            // blob z-index
	styleProperties: [...]   // computed styles to capture and morph (camelCase longhands)
});
```

`attraction` and `friction` are live-tunable mid-flight via `setAttraction()` / `setFriction()`.

## API

| Member | Description |
| --- | --- |
| `show({ from, to, display? })` | Morph from → to. Resolves `true` on settle, `false` if superseded. `display` is applied if `to` is `display: none` at measure time. |
| `hide()` | Morph back (remembers the pair, re-measures both). Same promise semantics. |
| `stop()` | Abort and restore both elements to their pre-show resting state. |
| `destroy()` | `stop()` + remove all listeners. |
| `setAttraction(n)` / `setFriction(n)` | Live spring tuning. |
| `state` | `'idle' \| 'showing' \| 'shown' \| 'hiding'` |
| `progress` | Last-known progress (overshoots past 1 while settling). |

## Events

`on(event, fn)` / `off(event, fn)` — payloads carry the logical `{ from, to }` pair.

| Event | When |
| --- | --- |
| `show` / `hide` | Morph starts (including a mid-flight reversal). |
| `change` | Every frame — `{ progress, phase }`. |
| `reveal` / `unreveal` | The run's destination element starts/stops painting — `{ from, to }` in run orientation. Fires at the reveal boundary while the destination is still at opacity 0, which makes `reveal` the seam-free moment for layer promotion (e.g. `dialog.showModal()`; promoting at `shown` repaints a visible surface). |
| `shown` / `hidden` | Spring settled. |
| `stop` | `stop()` was called — `{ progress }`. |

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
