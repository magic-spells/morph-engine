import PhysicsEngine from "@magic-spells/physics-engine";
import FrameEngine from "@magic-spells/frame-engine";
//#region src/event-emitter.js
var EventEmitter = class {
	#events;
	constructor() {
		this.#events = /* @__PURE__ */ new Map();
	}
	/**
	* Binds a listener to an event.
	* @param {string} event - The event to bind the listener to.
	* @param {Function} listener - The listener function to bind.
	* @returns {EventEmitter} The current instance for chaining.
	* @throws {TypeError} If the listener is not a function.
	*/
	on(event, listener) {
		if (typeof listener !== "function") throw new TypeError("Listener must be a function");
		const listeners = this.#events.get(event) || [];
		if (!listeners.includes(listener)) listeners.push(listener);
		this.#events.set(event, listeners);
		return this;
	}
	/**
	* Unbinds a listener from an event.
	* @param {string} event - The event to unbind the listener from.
	* @param {Function} listener - The listener function to unbind.
	* @returns {EventEmitter} The current instance for chaining.
	*/
	off(event, listener) {
		const listeners = this.#events.get(event);
		if (!listeners) return this;
		const index = listeners.indexOf(listener);
		if (index !== -1) {
			listeners.splice(index, 1);
			if (listeners.length === 0) this.#events.delete(event);
			else this.#events.set(event, listeners);
		}
		return this;
	}
	/**
	* Triggers an event and calls all bound listeners.
	* @param {string} event - The event to trigger.
	* @param {...*} args - Arguments to pass to the listener functions.
	* @returns {boolean} True if the event had listeners, false otherwise.
	*/
	emit(event, ...args) {
		const listeners = this.#events.get(event);
		if (!listeners || listeners.length === 0) return false;
		const snapshot = listeners.slice();
		for (let i = 0, n = snapshot.length; i < n; ++i) try {
			snapshot[i].apply(this, args);
		} catch (error) {
			console.error(`Error in listener for event '${event}':`, error);
		}
		return true;
	}
	/**
	* Removes all listeners for a specific event or all events.
	* @param {string} [event] - The event to remove listeners from. If not provided, removes all listeners.
	* @returns {EventEmitter} The current instance for chaining.
	*/
	removeAllListeners(event) {
		if (event) this.#events.delete(event);
		else this.#events.clear();
		return this;
	}
};
//#endregion
//#region src/morph-engine.js
var TRAVEL = 1e3;
var SETTLE_POSITION_EPSILON = 1;
var SETTLE_DELTA_EPSILON = .5;
var DEFAULT_STYLE_PROPERTIES = [
	"backgroundColor",
	"borderTopLeftRadius",
	"borderTopRightRadius",
	"borderBottomRightRadius",
	"borderBottomLeftRadius",
	"borderTopWidth",
	"borderRightWidth",
	"borderBottomWidth",
	"borderLeftWidth",
	"borderTopColor",
	"borderRightColor",
	"borderBottomColor",
	"borderLeftColor"
];
var BORDER_SIDES = [
	"Top",
	"Right",
	"Bottom",
	"Left"
];
var CLAMP_POSITIVE = [
	"width",
	"height",
	"borderTopLeftRadius",
	"borderTopRightRadius",
	"borderBottomRightRadius",
	"borderBottomLeftRadius",
	"borderTopWidth",
	"borderRightWidth",
	"borderBottomWidth",
	"borderLeftWidth"
];
var MANAGED_PROPERTIES = [
	"visibility",
	"display",
	"opacity",
	"transform",
	"transformOrigin",
	"willChange",
	"transition"
];
var scrollLockCount = 0;
var savedBodyOverflow = "";
/** Acquires one share of the module-level body scroll lock. */
function acquireScrollLock() {
	if (scrollLockCount++ === 0) {
		savedBodyOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
	}
}
/** Releases one share of the module-level body scroll lock. */
function releaseScrollLock() {
	if (scrollLockCount === 0) return;
	if (--scrollLockCount === 0) {
		document.body.style.overflow = savedBodyOverflow;
		savedBodyOverflow = "";
	}
}
function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}
function round(value) {
	return Math.round(value * 100) / 100;
}
var COLOR_PATTERN = /rgba?\([^)]*\)/;
/**
* Parses a computed rgb()/rgba() color string into channels.
* Computed styles always serialize sRGB colors this way.
* @param {string} colorString
* @returns {{red: number, green: number, blue: number, alpha: number}}
*/
function parseColor(colorString) {
	const match = colorString.match(/rgba?\(([^)]*)\)/);
	if (!match) return {
		red: 0,
		green: 0,
		blue: 0,
		alpha: 1
	};
	const parts = match[1].split(",").map((part) => parseFloat(part));
	return {
		red: parts[0] || 0,
		green: parts[1] || 0,
		blue: parts[2] || 0,
		alpha: parts.length > 3 ? parts[3] : 1
	};
}
/**
* Parses a computed box-shadow into its first shadow's parts.
* Handles both serialization orders (color-first and color-last).
* @param {string} computedShadow - Value from getComputedStyle().boxShadow
* @returns {{x: number, y: number, blur: number, spread: number, color: Object}|null}
*/
function parseShadow(computedShadow) {
	if (!computedShadow || computedShadow === "none") return null;
	let first = computedShadow;
	let depth = 0;
	for (let i = 0; i < computedShadow.length; i++) {
		const character = computedShadow[i];
		if (character === "(") depth++;
		else if (character === ")") depth--;
		else if (character === "," && depth === 0) {
			first = computedShadow.slice(0, i);
			break;
		}
	}
	const colorMatch = first.match(COLOR_PATTERN);
	const color = parseColor(colorMatch ? colorMatch[0] : "rgba(0, 0, 0, 1)");
	const [x = 0, y = 0, blur = 0, spread = 0] = first.replace(COLOR_PATTERN, "").trim().split(/\s+/).filter((token) => token !== "inset" && token !== "").map(parseFloat);
	return {
		x,
		y,
		blur,
		spread,
		color
	};
}
/**
* Interpolates two parsed shadows at raw p (extrapolates during overshoot,
* so the shadow bounces with the geometry). A missing end fades through the
* other end's color at alpha 0 to avoid a hue lurch through transparent black.
* @param {Object|null} fromShadow
* @param {Object|null} toShadow
* @param {number} p
* @returns {string} A CSS box-shadow value
*/
function lerpShadow(fromShadow, toShadow, p) {
	if (!fromShadow && !toShadow) return "none";
	const zeroed = (other) => ({
		x: 0,
		y: 0,
		blur: 0,
		spread: 0,
		color: {
			...other.color,
			alpha: 0
		}
	});
	const start = fromShadow || zeroed(toShadow);
	const end = toShadow || zeroed(fromShadow);
	const lerp = (a, b) => a + (b - a) * p;
	return `${round(lerp(start.x, end.x))}px ${round(lerp(start.y, end.y))}px ${round(Math.max(0, lerp(start.blur, end.blur)))}px ${round(lerp(start.spread, end.spread))}px rgba(${Math.round(clamp(lerp(start.color.red, end.color.red), 0, 255))}, ${Math.round(clamp(lerp(start.color.green, end.color.green), 0, 255))}, ${Math.round(clamp(lerp(start.color.blue, end.color.blue), 0, 255))}, ${round(clamp(lerp(start.color.alpha, end.color.alpha), 0, 1))})`;
}
/**
* Shared-element morph engine. A fixed-position blob springs from a source
* element's rect and styles to a target element's, dissolving the source's
* content on the way out and revealing the target — mirrored to the blob's
* geometry so it inherits the spring's settle bounce — on the way in.
*
* show() morphs source → target; hide() morphs back. Calling either mid-flight
* reverses the spring in place. Emits: show, hide, change, shown, hidden, stop,
* complete.
*/
var MorphEngine = class extends EventEmitter {
	#spring;
	#attraction;
	#friction;
	#frames = null;
	#blob = null;
	#cloneWrapper = null;
	#styleProperties;
	#state = "idle";
	#p = 0;
	#resolveRun = null;
	#pendingComplete = null;
	#sourceElement = null;
	#targetElement = null;
	#heldSource = null;
	#displayOverride = null;
	#savedInline = /* @__PURE__ */ new Map();
	#holdsScrollLock = false;
	#fromMeasure = null;
	#toMeasure = null;
	#toElement = null;
	#shownPosition = TRAVEL;
	#revealed = false;
	#revealStart = .75;
	#revealFull = .875;
	#sourceRevealed = false;
	#sourceRevealUntil = .25;
	#cloneFadeUntil = .25;
	#springTarget = TRAVEL;
	#lastPosition = 0;
	#settleCount = 0;
	/**
	* @param {Object} [options]
	* @param {number} [options.attraction=0.1] - Spring attraction (0, 1) exclusive
	* @param {number} [options.friction=0.32] - Spring friction (0, 1) exclusive
	* @param {string[]} [options.styleProperties] - Computed styles captured and morphed
	*   (camelCase longhands — shorthands snap instead of interpolating)
	* @param {number} [options.revealAt=0.75] - Progress where the target reveal window begins
	* @param {number} [options.sourceRevealUntil=0.25] - Progress where the source reveal window
	*   ends (mirrors revealAt at the p→0 end so reversals crossfade instead of hard-swapping)
	* @param {number} [options.cloneFadeUntil=0.25] - Progress where the source-content clone
	*   finishes dissolving
	* @param {boolean} [options.cloneContents=true] - Clone the source's content into the blob
	* @param {Object} [options.hide] - Sparse overrides for the hide leg
	* @param {number} [options.hide.attraction] - Hide spring attraction
	* @param {number} [options.hide.friction] - Hide spring friction
	* @param {number} [options.hide.revealAt] - Hide target reveal start
	* @param {number} [options.hide.sourceRevealUntil] - Hide source reveal end
	* @param {number} [options.hide.cloneFadeUntil] - Hide clone fade end
	* @param {boolean} [options.hide.cloneContents] - Hide clone-content setting
	* @param {boolean} [options.lockScroll=true] - Lock body scroll from show until fully
	*   hidden — a scroll mid-morph would strand the fixed-position blob
	* @param {number} [options.zIndex=9999] - Blob z-index
	*/
	constructor({ attraction = .1, friction = .32, styleProperties = DEFAULT_STYLE_PROPERTIES, revealAt = .75, sourceRevealUntil = .25, cloneFadeUntil = .25, cloneContents = true, hide = {}, lockScroll = true, zIndex = 9999 } = {}) {
		super();
		this.#attraction = attraction;
		this.#friction = friction;
		this.#spring = new PhysicsEngine({
			attraction,
			friction
		});
		this.#styleProperties = styleProperties;
		this.revealAt = revealAt;
		this.sourceRevealUntil = sourceRevealUntil;
		this.cloneFadeUntil = cloneFadeUntil;
		this.cloneContents = cloneContents;
		this.hideConfig = hide;
		this.lockScroll = lockScroll;
		this.zIndex = zIndex;
		this.#spring.on("change", ({ position }) => {
			if (this.#state !== "showing" && this.#state !== "hiding") return;
			const p = position / TRAVEL;
			this.#p = p;
			this.#applyFrame(p);
			this.emit("change", {
				progress: p,
				phase: this.#state
			});
			if (Math.abs(position - this.#springTarget) < SETTLE_POSITION_EPSILON && Math.abs(position - this.#lastPosition) < SETTLE_DELTA_EPSILON) {
				if (++this.#settleCount >= 2) {
					this.#applyFrame(this.#springTarget / TRAVEL);
					this.#spring.stop();
					this.#settle();
					return;
				}
			} else this.#settleCount = 0;
			this.#lastPosition = position;
		});
		this.#spring.on("complete", () => this.#settle());
	}
	/** @returns {string} 'idle' | 'showing' | 'shown' | 'hiding' */
	get state() {
		return this.#state;
	}
	/** @returns {number} Last-known morph progress (overshoots past 1 while settling) */
	get progress() {
		return this.#p;
	}
	/**
	* Morphs from the source element to the target element. Called while hiding,
	* it reverses the in-flight morph instead (arguments are ignored).
	* @param {Object} options
	* @param {HTMLElement} options.from - Source element (stays hidden while shown)
	* @param {HTMLElement} options.to - Target element (revealed as the blob arrives)
	* @param {string} [options.display] - display value applied to a display:none target
	* @param {boolean} [options.oneWay=false] - Complete and hand ownership to the target on settle
	* @param {number} [options.attraction] - One-off spring attraction
	* @param {number} [options.friction] - One-off spring friction
	* @param {number} [options.revealAt] - One-off target reveal start
	* @param {number} [options.sourceRevealUntil] - One-off source reveal end
	* @param {number} [options.cloneFadeUntil] - One-off clone fade end
	* @param {boolean} [options.cloneContents] - One-off clone-content setting
	* @returns {Promise<boolean>} true when settled, false if superseded or rejected
	*/
	show({ from, to, display = null, oneWay = false, attraction, friction, revealAt, sourceRevealUntil, cloneFadeUntil, cloneContents } = {}) {
		const overrides = {
			attraction,
			friction,
			revealAt,
			sourceRevealUntil,
			cloneFadeUntil,
			cloneContents
		};
		if (this.#state === "showing" || this.#state === "shown") {
			console.warn(`MorphEngine: show() ignored — already ${this.#state}`);
			return Promise.resolve(false);
		}
		if (this.#state === "hiding") {
			const promise = this.#reverse("showing", overrides);
			if (oneWay) this.#pendingComplete = { restoreSource: false };
			return promise;
		}
		if (!from || !to) throw new Error("MorphEngine: show() requires { from, to } elements.");
		this.#sourceElement = from;
		this.#targetElement = to;
		this.#displayOverride = display;
		this.restoreSource();
		this.#saveInline(from);
		this.#saveInline(to);
		if (this.lockScroll && !this.#holdsScrollLock) {
			this.#holdsScrollLock = true;
			acquireScrollLock();
		}
		const promise = this.#morph(from, to, "showing", overrides);
		if (oneWay) this.#pendingComplete = { restoreSource: false };
		return promise;
	}
	/**
	* Morphs back from the target to the source. Called while showing, it
	* reverses the in-flight morph.
	* @param {Object} [options]
	* @param {number} [options.attraction] - One-off spring attraction
	* @param {number} [options.friction] - One-off spring friction
	* @param {number} [options.revealAt] - One-off target reveal start
	* @param {number} [options.sourceRevealUntil] - One-off source reveal end
	* @param {number} [options.cloneFadeUntil] - One-off clone fade end
	* @param {boolean} [options.cloneContents] - One-off clone-content setting
	* @returns {Promise<boolean>} true when settled, false if superseded or rejected
	*/
	hide({ attraction, friction, revealAt, sourceRevealUntil, cloneFadeUntil, cloneContents } = {}) {
		const overrides = {
			attraction,
			friction,
			revealAt,
			sourceRevealUntil,
			cloneFadeUntil,
			cloneContents
		};
		if (this.#state === "idle" || this.#state === "hiding") {
			console.warn(`MorphEngine: hide() ignored — ${this.#state}`);
			return Promise.resolve(false);
		}
		if (this.#state === "showing") return this.#reverse("hiding", overrides);
		return this.#morph(this.#targetElement, this.#sourceElement, "hiding", overrides);
	}
	/**
	* Hands a shown or showing one-way morph to the target without emitting stop.
	* @param {Object} [options]
	* @param {boolean} [options.restoreSource=false] - Fully restore the source on handoff
	* @returns {boolean} True when completed immediately or armed for settle.
	*/
	complete({ restoreSource = false } = {}) {
		if (this.#state === "shown") {
			this.#finalizeComplete(restoreSource);
			return true;
		}
		if (this.#state === "showing") {
			this.#pendingComplete = { restoreSource };
			return true;
		}
		console.warn(`MorphEngine: complete() ignored — ${this.#state}`);
		return false;
	}
	/**
	* Aborts any morph and restores both elements to their pre-show resting state.
	*
	* `restoreSource: false` makes this a transport HANDOFF rather than an abort:
	* the blob goes, the target is restored and scroll unlocks, but the source
	* stays hidden and keeps its `morphing` mark, because a morph does still own
	* it. The caller is taking the flight over and calls `restoreSource()` when it
	* is genuinely finished. Without the option a caller that only wants the blob
	* gone has to re-hide the source itself in the same synchronous task, or the
	* source flashes at full opacity for a frame — a timing invariant nothing can
	* enforce from the outside.
	* @param {Object} [options]
	* @param {boolean} [options.restoreSource=true] - Restore the source now.
	*/
	stop({ restoreSource = true } = {}) {
		this.#pendingComplete = null;
		if (this.#state === "idle") return;
		this.#supersede();
		this.#spring.stop();
		this.#removeBlob();
		const source = this.#sourceElement;
		const target = this.#targetElement;
		if (source) if (restoreSource) {
			this.#restoreInline(source);
			source.removeAttribute("morphing");
		} else this.#heldSource = source;
		if (target) {
			this.#restoreInline(target);
			target.removeAttribute("morphing");
			target.removeAttribute("morph-shown");
		}
		this.#unlockScroll();
		const progress = this.#p;
		this.#state = "idle";
		this.#p = 0;
		this.emit("stop", { progress });
	}
	/**
	* Restores a source element held back by `stop({ restoreSource: false })`.
	*
	* Idempotent, and harmless on a detached element. `show()` and `destroy()`
	* call it so a held source can never leak into the next flight — one engine
	* is routinely reused run after run.
	* @returns {boolean} True when a held source was restored.
	*/
	restoreSource() {
		const source = this.#heldSource;
		if (!source) return false;
		this.#heldSource = null;
		this.#restoreInline(source);
		source.removeAttribute("morphing");
		return true;
	}
	/**
	* Stops and removes all listeners. The engine is unusable afterwards.
	*/
	destroy() {
		this.stop();
		this.restoreSource();
		this.#spring.removeAllListeners();
		this.removeAllListeners();
	}
	/** @param {number} attraction - Show/default attraction, applied live to the spring */
	setAttraction(attraction) {
		this.#attraction = attraction;
		this.#spring.setAttraction(attraction);
	}
	/** @param {number} friction - Show/default friction, applied live to the spring */
	setFriction(friction) {
		this.#friction = friction;
		this.#spring.setFriction(friction);
	}
	/**
	* The single morph routine — show and hide are the same mechanics with the
	* roles swapped. The blob starts pixel-identical to fromElement (its content
	* cloned and frozen on top), springs to toElement's rect and styles, and
	* reveals toElement across the final stretch.
	*/
	#morph(fromElement, toElement, phase, overrides = {}) {
		this.#pendingComplete = null;
		this.#supersede();
		const config = this.#resolveConfig(phase, overrides);
		this.#spring.setAttraction(config.attraction);
		this.#spring.setFriction(config.friction);
		const fromMeasure = this.#measure(fromElement);
		const toMeasure = this.#measure(toElement);
		this.#fromMeasure = fromMeasure;
		this.#toMeasure = toMeasure;
		this.#toElement = toElement;
		this.#shownPosition = phase === "showing" ? TRAVEL : 0;
		this.#state = phase;
		this.#revealed = false;
		this.#sourceRevealed = false;
		this.#revealStart = config.revealAt;
		this.#revealFull = config.revealAt + (1 - config.revealAt) / 2;
		this.#sourceRevealUntil = config.sourceRevealUntil;
		this.#cloneFadeUntil = config.cloneFadeUntil;
		this.#reconcileBorderColors(fromMeasure, toMeasure);
		this.#frames = new FrameEngine(this.#buildKeyframes(fromMeasure, toMeasure));
		this.#removeBlob();
		this.#createBlob(fromMeasure, toMeasure, config.cloneContents);
		this.#markElements(phase);
		fromElement.style.transition = "none";
		toElement.style.transition = "none";
		fromElement.style.visibility = "hidden";
		toElement.style.visibility = "hidden";
		toElement.style.opacity = "0";
		this.#applyFrame(0);
		this.emit(phase === "showing" ? "show" : "hide", {
			from: this.#sourceElement,
			to: this.#targetElement
		});
		const promise = new Promise((resolve) => {
			this.#resolveRun = resolve;
		});
		this.#armSettle(0, TRAVEL);
		this.#spring.animateTo(0, TRAVEL);
		return promise;
	}
	/**
	* Reverses the in-flight morph. The keyframe mapping, blob, and clone are all
	* pure functions of p, so travelling back unwinds everything automatically —
	* the reveal window un-reveals, the clone fades back in, and the blob lands
	* exactly where it started.
	*/
	#reverse(newPhase, overrides = {}) {
		this.#pendingComplete = null;
		this.#supersede();
		const config = this.#resolveConfig(newPhase, overrides);
		this.#spring.setAttraction(config.attraction);
		this.#spring.setFriction(config.friction);
		this.#state = newPhase;
		this.#markElements(newPhase);
		const targetPosition = newPhase === "showing" ? this.#shownPosition : TRAVEL - this.#shownPosition;
		this.emit(newPhase === "showing" ? "show" : "hide", {
			from: this.#sourceElement,
			to: this.#targetElement
		});
		const promise = new Promise((resolve) => {
			this.#resolveRun = resolve;
		});
		this.#armSettle(this.#p * TRAVEL, targetPosition);
		this.#spring.animateTo(this.#p * TRAVEL, targetPosition);
		return promise;
	}
	/**
	* Arms the early-settle detector for a fresh run. Called at every animateTo so
	* a reversal never inherits stale proximity state from the run it interrupts.
	* @param {number} startPosition - Spring position the run begins from
	* @param {number} target - Spring position the run is heading toward
	*/
	#armSettle(startPosition, target) {
		this.#springTarget = target;
		this.#lastPosition = startPosition;
		this.#settleCount = 0;
	}
	/**
	* Spring settled — finalize whichever logical state we were heading toward.
	* The spring's final change event already applied the exact end frame.
	*/
	#settle() {
		if (this.#state !== "showing" && this.#state !== "hiding") return;
		const resolve = this.#resolveRun;
		this.#resolveRun = null;
		if (this.#state === "showing") this.#finalizeShown();
		else this.#finalizeHidden();
		if (this.#state === "shown" && this.#pendingComplete) {
			const { restoreSource } = this.#pendingComplete;
			this.#pendingComplete = null;
			this.#finalizeComplete(restoreSource);
		}
		if (resolve) resolve(true);
	}
	#finalizeShown() {
		this.#removeBlob();
		const source = this.#sourceElement;
		const target = this.#targetElement;
		this.#restoreProperties(target, [
			"opacity",
			"transform",
			"transformOrigin",
			"willChange",
			"transition"
		]);
		target.style.visibility = "visible";
		this.#restoreProperties(source, [
			"opacity",
			"transform",
			"transformOrigin",
			"willChange"
		]);
		source.style.visibility = "hidden";
		source.removeAttribute("morphing");
		target.removeAttribute("morphing");
		target.setAttribute("morph-shown", "");
		this.#state = "shown";
		this.emit("shown", {
			from: source,
			to: target
		});
	}
	#finalizeHidden() {
		this.#removeBlob();
		const source = this.#sourceElement;
		const target = this.#targetElement;
		this.#restoreInline(source);
		this.#restoreInline(target);
		source.removeAttribute("morphing");
		target.removeAttribute("morphing");
		target.removeAttribute("morph-shown");
		this.#unlockScroll();
		this.#state = "idle";
		this.#p = 0;
		this.emit("hidden", {
			from: source,
			to: target
		});
	}
	/**
	* Releases a shown morph to app ownership while preserving the target's state.
	* @param {boolean} restoreSource - Whether to fully restore the source element
	*/
	#finalizeComplete(restoreSource) {
		const source = this.#sourceElement;
		const target = this.#targetElement;
		this.#savedInline.delete(target);
		target.removeAttribute("morph-shown");
		if (restoreSource) this.#restoreInline(source);
		else {
			this.#restoreProperties(source, ["transition"]);
			this.#savedInline.delete(source);
		}
		this.#unlockScroll();
		this.#sourceElement = null;
		this.#targetElement = null;
		this.#displayOverride = null;
		this.#state = "idle";
		this.#p = 0;
		this.emit("complete", {
			from: source,
			to: target
		});
	}
	/** Releases this engine's share of the module-level body scroll lock. */
	#unlockScroll() {
		if (!this.#holdsScrollLock) return;
		this.#holdsScrollLock = false;
		releaseScrollLock();
	}
	/**
	* Resolves sparse public, hide-leg, and per-call settings for a run.
	* @param {string} phase - 'showing' or 'hiding'
	* @param {Object} overrides - Sparse per-call overrides
	* @returns {Object} Resolved spring and choreography settings
	*/
	#resolveConfig(phase, overrides = {}) {
		const config = {
			attraction: this.#attraction,
			friction: this.#friction,
			revealAt: this.revealAt,
			sourceRevealUntil: this.sourceRevealUntil,
			cloneFadeUntil: this.cloneFadeUntil,
			cloneContents: this.cloneContents
		};
		const keys = Object.keys(config);
		if (phase === "hiding") {
			for (const key of keys) if (this.hideConfig[key] !== void 0) config[key] = this.hideConfig[key];
		}
		for (const key of keys) if (overrides[key] !== void 0) config[key] = overrides[key];
		return config;
	}
	/** Resolves a superseded run's promise with false. */
	#supersede() {
		if (this.#resolveRun) {
			this.#resolveRun(false);
			this.#resolveRun = null;
		}
	}
	/**
	* The whole visual state as a pure function of p. Reveal handling is an
	* idempotent check rather than a one-shot flag so a reversed spring that
	* swings p back down automatically un-reveals the target.
	*/
	#applyFrame(p) {
		const styles = this.#frames.getFrame(p);
		for (const property of CLAMP_POSITIVE) if (property in styles && parseFloat(styles[property]) < 0) styles[property] = "0px";
		Object.assign(this.#blob.style, styles);
		this.#blob.style.boxShadow = lerpShadow(this.#fromMeasure.shadow, this.#toMeasure.shadow, p);
		if (this.#cloneWrapper) {
			const fade = this.#cloneFadeUntil > 0 ? clamp(1 - p / this.#cloneFadeUntil, 0, 1) : p <= 0 ? 1 : 0;
			this.#cloneWrapper.style.opacity = String(fade);
		}
		if (p >= this.#revealStart) {
			this.#ensureRevealed();
			const target = this.#toElement;
			const naturalRect = this.#toMeasure.rect;
			const blobRect = {
				top: parseFloat(styles.top),
				left: parseFloat(styles.left),
				width: parseFloat(styles.width),
				height: parseFloat(styles.height)
			};
			const fadeProgress = clamp((p - this.#revealStart) / (this.#revealFull - this.#revealStart), 0, 1);
			target.style.opacity = String(fadeProgress);
			target.style.transformOrigin = "0 0";
			target.style.transform = `translate(${round(blobRect.left - naturalRect.left)}px, ${round(blobRect.top - naturalRect.top)}px) scale(${blobRect.width / naturalRect.width}, ${blobRect.height / naturalRect.height})`;
		} else this.#ensureUnrevealed();
		if (p <= this.#sourceRevealUntil) {
			this.#ensureSourceRevealed();
			const source = this.#fromMeasure.element;
			const naturalRect = this.#fromMeasure.rect;
			const blobRect = {
				top: parseFloat(styles.top),
				left: parseFloat(styles.left),
				width: parseFloat(styles.width),
				height: parseFloat(styles.height)
			};
			const half = this.#sourceRevealUntil / 2;
			const sourceOpacity = clamp((this.#sourceRevealUntil - p) / half, 0, 1);
			source.style.opacity = String(sourceOpacity);
			source.style.transformOrigin = "0 0";
			source.style.transform = `translate(${round(blobRect.left - naturalRect.left)}px, ${round(blobRect.top - naturalRect.top)}px) scale(${blobRect.width / naturalRect.width}, ${blobRect.height / naturalRect.height})`;
			const quarter = half / 2;
			const blobFactor = clamp((p - quarter) / quarter, 0, 1);
			this.#blob.style.opacity = String(parseFloat(styles.opacity ?? "1") * blobFactor);
		} else this.#ensureSourceUnrevealed();
	}
	#ensureRevealed() {
		if (this.#revealed) return;
		this.#revealed = true;
		const target = this.#toElement;
		if (this.#toMeasure.wasDisplayNone) target.style.display = this.#displayOverride || "block";
		target.style.visibility = "visible";
		target.style.willChange = "transform, opacity";
		this.emit("reveal", {
			from: this.#fromMeasure.element,
			to: target
		});
	}
	#ensureUnrevealed() {
		if (!this.#revealed) return;
		this.#revealed = false;
		const target = this.#toElement;
		target.style.visibility = "hidden";
		target.style.opacity = "0";
		this.emit("unreveal", {
			from: this.#fromMeasure.element,
			to: target
		});
	}
	/**
	* Source mirror of #ensureRevealed — makes the real from-element paintable so it
	* can crossfade in under the blob at the p→0 end. Idempotent.
	*/
	#ensureSourceRevealed() {
		if (this.#sourceRevealed) return;
		this.#sourceRevealed = true;
		const source = this.#fromMeasure.element;
		if (this.#fromMeasure.wasDisplayNone) source.style.display = this.#displayOverride || "block";
		source.style.visibility = "visible";
		source.style.willChange = "transform, opacity";
	}
	/**
	* Source mirror of #ensureUnrevealed — re-hides the from-element once p leaves the
	* source window. Transform/willChange residue is cleared at finalize. Idempotent.
	*/
	#ensureSourceUnrevealed() {
		if (!this.#sourceRevealed) return;
		this.#sourceRevealed = false;
		const source = this.#fromMeasure.element;
		source.style.visibility = "hidden";
		source.style.opacity = "0";
	}
	/**
	* Measures an element's viewport rect and captured computed styles. A
	* display:none element is flipped on invisibly for one synchronous read.
	* (visibility:hidden elements keep their layout and measure normally.)
	*/
	#measure(element) {
		let restore = null;
		if (element.getClientRects().length === 0) {
			const style = element.style;
			restore = {
				display: style.display,
				visibility: style.visibility,
				transition: style.transition
			};
			style.transition = "none";
			style.visibility = "hidden";
			style.display = this.#displayOverride || "block";
		}
		const rect = element.getBoundingClientRect();
		const computed = getComputedStyle(element);
		const styles = {};
		for (const property of this.#styleProperties) styles[property] = computed[property];
		const measure = {
			element,
			rect,
			styles,
			shadow: parseShadow(computed.boxShadow),
			borderStyle: computed.borderTopStyle,
			backdropFilter: computed.backdropFilter || computed.webkitBackdropFilter,
			backgroundImage: computed.backgroundImage,
			backgroundSize: computed.backgroundSize,
			backgroundRepeat: computed.backgroundRepeat,
			backgroundPosition: computed.backgroundPosition,
			wasDisplayNone: restore !== null
		};
		if (restore) Object.assign(element.style, restore);
		return measure;
	}
	/**
	* A borderless element's computed border-color falls back to currentColor (its
	* text color), and `transparent` computes to rgba(0,0,0,0) — lerping toward
	* either drags the visible end's border through an unrelated hue while the
	* width or alpha collapses. Rewrite the degenerate end's color so only
	* width/alpha animate: an absent border holds the visible end's color
	* verbatim, a fully transparent one holds its hue at alpha 0.
	*/
	#reconcileBorderColors(fromMeasure, toMeasure) {
		const absent = (measure) => measure.borderStyle === "none" || BORDER_SIDES.every((side) => parseFloat(measure.styles[`border${side}Width`]) === 0);
		const fromAbsent = absent(fromMeasure);
		const toAbsent = absent(toMeasure);
		if (fromAbsent && toAbsent) return;
		for (const side of BORDER_SIDES) {
			const key = `border${side}Color`;
			const fromColor = fromMeasure.styles[key];
			const toColor = toMeasure.styles[key];
			if (!fromColor || !toColor) continue;
			const fromDegenerate = fromAbsent || parseColor(fromColor).alpha === 0;
			if (fromDegenerate === (toAbsent || parseColor(toColor).alpha === 0)) continue;
			const visibleColor = fromDegenerate ? toColor : fromColor;
			const { red, green, blue } = parseColor(visibleColor);
			const replacement = (fromDegenerate ? fromAbsent : toAbsent) ? visibleColor : `rgba(${red}, ${green}, ${blue}, 0)`;
			(fromDegenerate ? fromMeasure : toMeasure).styles[key] = replacement;
		}
	}
	#buildKeyframes(fromMeasure, toMeasure) {
		const rectStyles = (rect) => ({
			top: `${rect.top}px`,
			left: `${rect.left}px`,
			width: `${rect.width}px`,
			height: `${rect.height}px`
		});
		const blobClear = this.#revealFull + (1 - this.#revealFull) / 2;
		return {
			0: {
				...rectStyles(fromMeasure.rect),
				...fromMeasure.styles
			},
			[this.#revealFull * 100]: { opacity: "1" },
			[blobClear * 100]: { opacity: "0" },
			100: {
				...rectStyles(toMeasure.rect),
				...toMeasure.styles
			}
		};
	}
	#createBlob(fromMeasure, toMeasure, cloneContents) {
		const blob = document.createElement("morph-blob");
		const borderStyle = toMeasure.borderStyle !== "none" ? toMeasure.borderStyle : fromMeasure.borderStyle !== "none" ? fromMeasure.borderStyle : "solid";
		Object.assign(blob.style, {
			position: "fixed",
			top: "0",
			left: "0",
			margin: "0",
			boxSizing: "border-box",
			pointerEvents: "none",
			overflow: "hidden",
			display: "block",
			zIndex: String(this.zIndex),
			borderStyle,
			willChange: "top, left, width, height, opacity"
		});
		const backdropFilter = toMeasure.backdropFilter !== "none" ? toMeasure.backdropFilter : fromMeasure.backdropFilter !== "none" ? fromMeasure.backdropFilter : null;
		if (backdropFilter) {
			blob.style.backdropFilter = backdropFilter;
			blob.style.webkitBackdropFilter = backdropFilter;
		}
		const backgroundMeasure = toMeasure.backgroundImage !== "none" ? toMeasure : fromMeasure.backgroundImage !== "none" ? fromMeasure : null;
		if (backgroundMeasure) {
			blob.style.backgroundImage = backgroundMeasure.backgroundImage;
			blob.style.backgroundSize = backgroundMeasure.backgroundSize;
			blob.style.backgroundRepeat = backgroundMeasure.backgroundRepeat;
			blob.style.backgroundPosition = backgroundMeasure.backgroundPosition;
		}
		if (cloneContents) this.#createClone(blob, fromMeasure);
		document.body.appendChild(blob);
		this.#blob = blob;
	}
	/**
	* Freezes a visual copy of the source's content inside the blob. The wrapper
	* keeps the source's original dimensions so text never rewraps as the blob
	* resizes; the blob's overflow:hidden clips it. The clone's own surface
	* (background, border, shadow) is stripped — the blob renders the surface.
	*/
	#createClone(blob, fromMeasure) {
		const clone = fromMeasure.element.cloneNode(true);
		clone.removeAttribute("id");
		clone.removeAttribute("morphing");
		Object.assign(clone.style, {
			position: "static",
			margin: "0",
			width: "100%",
			height: "100%",
			transform: "none",
			transition: "none",
			visibility: "visible",
			opacity: "1",
			boxShadow: "none",
			background: "transparent",
			borderColor: "transparent"
		});
		const wrapper = document.createElement("div");
		Object.assign(wrapper.style, {
			position: "absolute",
			top: "0",
			left: "0",
			width: `${fromMeasure.rect.width}px`,
			height: `${fromMeasure.rect.height}px`,
			pointerEvents: "none"
		});
		wrapper.appendChild(clone);
		blob.appendChild(wrapper);
		this.#cloneWrapper = wrapper;
	}
	#removeBlob() {
		if (!this.#blob) return;
		this.#blob.remove();
		this.#blob = null;
		this.#cloneWrapper = null;
	}
	/** Marks both elements for CSS hooks — which one the blob is flying away from. */
	#markElements(phase) {
		const showing = phase === "showing";
		this.#sourceElement.setAttribute("morphing", showing ? "source" : "target");
		this.#targetElement.setAttribute("morphing", showing ? "target" : "source");
	}
	#saveInline(element) {
		const saved = {};
		for (const property of MANAGED_PROPERTIES) saved[property] = element.style[property];
		this.#savedInline.set(element, saved);
	}
	#restoreProperties(element, properties) {
		const saved = this.#savedInline.get(element) || {};
		const hasTransition = properties.includes("transition");
		for (const property of properties) {
			if (property === "transition") continue;
			element.style[property] = saved[property] ?? "";
		}
		if (hasTransition) {
			element.offsetWidth;
			element.style.transition = saved.transition ?? "";
		}
	}
	#restoreInline(element) {
		this.#restoreProperties(element, MANAGED_PROPERTIES);
		this.#savedInline.delete(element);
	}
};
//#endregion
//#region src/morph-group.js
/**
* Per-item launch offset. A negative stagger runs the set in reverse order —
* the last item launches first — same convention as timeline-engine's clips.
* @param {number} stagger - Milliseconds between launches, sign picks the order
* @param {number} index - The item's position in the set
* @param {number} last - The last index in the set
* @returns {number} Delay in milliseconds
*/
function staggerDelay(stagger, index, last) {
	return (stagger >= 0 ? index : last - index) * Math.abs(stagger);
}
/**
* Fans a shared set of options out across a reusable pool of MorphEngine instances.
* This is a group trigger, not a timeline: each spring owns its own flight and settle.
*/
var MorphGroup = class extends EventEmitter {
	#options;
	#engines = [];
	#pendingLaunches = /* @__PURE__ */ new Map();
	#aggregateCancels = /* @__PURE__ */ new Set();
	#operation = 0;
	/** @param {Object} [options] - Options shared by every pooled MorphEngine */
	constructor(options = {}) {
		super();
		this.#options = options;
	}
	/** @returns {MorphEngine[]} A snapshot of the pooled engines */
	get engines() {
		return this.#engines.slice();
	}
	/** @returns {string} Advisory aggregate state */
	get state() {
		if (this.#engines.every((engine) => engine.state === "idle")) return "idle";
		if (this.#engines.some((engine) => engine.state === "showing")) return "showing";
		if (this.#engines.some((engine) => engine.state === "hiding")) return "hiding";
		return "shown";
	}
	/**
	* Morphs every pair with optional staggered launches. A negative stagger
	* launches in reverse order (last pair first), matching timeline-engine.
	* @param {{from: HTMLElement, to: HTMLElement, display?: string}[]} pairs
	* @param {Object} [options]
	* @param {number} [options.stagger=0] - Delay in milliseconds between launches
	* @param {boolean} [options.oneWay=false] - Complete every engine after it settles
	* @param {string} [options.display] - Shared display override
	* @returns {Promise<boolean>} True only when every flight settles
	*/
	async show(pairs, { stagger = 0, oneWay = false, display, ...overrides } = {}) {
		const operation = this.#startOperation();
		const engines = pairs.map((pair, index) => this.#engineAt(index));
		const cancelShown = this.#watchAggregate(engines, "shown", operation);
		const cancelComplete = oneWay ? this.#watchAggregate(engines, "complete", operation) : () => {};
		const last = pairs.length - 1;
		const promises = pairs.map((pair, index) => {
			const engine = engines[index];
			const pairDisplay = pair.display !== void 0 ? pair.display : display;
			return this.#schedule(staggerDelay(stagger, index, last), () => engine.show({
				...overrides,
				from: pair.from,
				to: pair.to,
				display: pairDisplay,
				oneWay
			}));
		});
		try {
			return (await Promise.all(promises)).every(Boolean);
		} finally {
			cancelShown();
			cancelComplete();
		}
	}
	/**
	* Reverses every live engine with optional staggered launches. A negative
	* stagger reverses in reverse order (last live engine first).
	* @param {Object} [options]
	* @param {number} [options.stagger=0] - Delay in milliseconds between launches
	* @returns {Promise<boolean>} True only when every live flight settles
	*/
	async hide({ stagger = 0, ...overrides } = {}) {
		const operation = this.#startOperation();
		const engines = this.#engines.filter((engine) => engine.state !== "idle");
		const cancelHidden = this.#watchAggregate(engines, "hidden", operation);
		const last = engines.length - 1;
		try {
			return (await Promise.all(engines.map((engine, index) => this.#schedule(staggerDelay(stagger, index, last), () => engine.state === "idle" ? false : engine.hide(overrides))))).every(Boolean);
		} finally {
			cancelHidden();
		}
	}
	/** Fans stop() out and cancels any flights waiting in the stagger window. */
	stop(options) {
		this.#startOperation();
		this.#engines.forEach((engine) => engine.stop(options));
	}
	/**
	* Hands every live engine to its target without emitting stop.
	* @param {Object} [options] - Options passed to MorphEngine.complete()
	* @returns {boolean} True only when every live engine completed or armed
	*/
	completeAll(options) {
		const operation = this.#startOperation();
		const engines = this.#engines.filter((engine) => engine.state !== "idle");
		const cancelComplete = this.#watchAggregate(engines, "complete", operation);
		const completed = engines.map((engine) => engine.complete(options)).every(Boolean);
		if (!completed) cancelComplete();
		return completed;
	}
	/** Cancels pending launches, destroys the pool, and removes group listeners. */
	destroy() {
		this.#startOperation();
		this.#engines.forEach((engine) => engine.destroy());
		this.#engines = [];
		this.removeAllListeners();
	}
	/** @returns {number} The new aggregate operation identifier */
	#startOperation() {
		this.#cancelPendingLaunches();
		for (const cancel of [...this.#aggregateCancels]) cancel();
		return ++this.#operation;
	}
	/** @param {number} index @returns {MorphEngine} The pooled engine for an item */
	#engineAt(index) {
		while (this.#engines.length <= index) this.#engines.push(new MorphEngine(this.#options));
		return this.#engines[index];
	}
	/**
	* Runs one launch now or after its stagger delay.
	* @param {number} delay
	* @param {Function} fn - Returns the engine's run promise
	* @returns {Promise<boolean>}
	*/
	#schedule(delay, fn) {
		if (delay <= 0) return fn();
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				this.#pendingLaunches.delete(timeout);
				Promise.resolve().then(fn).then(resolve, reject);
			}, delay);
			this.#pendingLaunches.set(timeout, resolve);
		});
	}
	/**
	* Emits one aggregate event when every supplied engine reaches it.
	* @param {MorphEngine[]} engines
	* @param {string} event
	* @param {number} operation
	* @returns {Function} Removes the temporary listeners
	*/
	#watchAggregate(engines, event, operation) {
		if (engines.length === 0) return () => {};
		const remaining = new Set(engines);
		const listeners = /* @__PURE__ */ new Map();
		const cancel = () => {
			for (const [engine, listener] of listeners) engine.off(event, listener);
			listeners.clear();
			this.#aggregateCancels.delete(cancel);
		};
		for (const engine of engines) {
			const listener = () => {
				engine.off(event, listener);
				listeners.delete(engine);
				remaining.delete(engine);
				if (remaining.size > 0) return;
				cancel();
				if (operation === this.#operation) this.emit(event);
			};
			listeners.set(engine, listener);
			engine.on(event, listener);
		}
		this.#aggregateCancels.add(cancel);
		return cancel;
	}
	/** Resolves unlaunched staggered flights as superseded. */
	#cancelPendingLaunches() {
		for (const [timeout, resolve] of this.#pendingLaunches) {
			clearTimeout(timeout);
			resolve(false);
		}
		this.#pendingLaunches.clear();
	}
};
//#endregion
export { MorphEngine, MorphGroup };

//# sourceMappingURL=morph-engine.esm.js.map