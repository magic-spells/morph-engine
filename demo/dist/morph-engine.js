(function(global, factory) {
	typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.MorphEngine = {}));
})(this, function(exports) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region node_modules/@magic-spells/physics-engine/dist/physics-engine.esm.js
	var f = class {
		#t;
		constructor() {
			this.#t = /* @__PURE__ */ new Map();
		}
		/**
		* Binds a listener to an event.
		* @param {string} event - The event to bind the listener to.
		* @param {Function} listener - The listener function to bind.
		* @returns {EventEmitter} The current instance for chaining.
		* @throws {TypeError} If the listener is not a function.
		*/
		on(t, i) {
			if (typeof i != "function") throw new TypeError("Listener must be a function");
			const s = this.#t.get(t) || [];
			return s.includes(i) || s.push(i), this.#t.set(t, s), this;
		}
		/**
		* Unbinds a listener from an event.
		* @param {string} event - The event to unbind the listener from.
		* @param {Function} listener - The listener function to unbind.
		* @returns {EventEmitter} The current instance for chaining.
		*/
		off(t, i) {
			const s = this.#t.get(t);
			if (!s) return this;
			const e = s.indexOf(i);
			return e !== -1 && (s.splice(e, 1), s.length === 0 ? this.#t.delete(t) : this.#t.set(t, s)), this;
		}
		/**
		* Triggers an event and calls all bound listeners.
		* @param {string} event - The event to trigger.
		* @param {...*} args - Arguments to pass to the listener functions.
		* @returns {boolean} True if the event had listeners, false otherwise.
		*/
		emit(t, ...i) {
			const s = this.#t.get(t);
			if (!s || s.length === 0) return !1;
			const e = s.slice();
			for (let n = 0, r = e.length; n < r; ++n) try {
				e[n].apply(this, i);
			} catch (h) {
				console.error(`Error in listener for event '${t}':`, h);
			}
			return !0;
		}
		/**
		* Removes all listeners for a specific event or all events.
		* @param {string} [event] - The event to remove listeners from. If not provided, removes all listeners.
		* @returns {EventEmitter} The current instance for chaining.
		*/
		removeAllListeners(t) {
			return t ? this.#t.delete(t) : this.#t.clear(), this;
		}
	};
	var b$1 = class extends f {
		#t;
		#m;
		#o;
		#n;
		#s;
		#e;
		#r;
		#h;
		#i;
		/**
		* Creates an instance of PhysicsEngine.
		* @param {number} [attraction=0.026] - The attraction value for physics-based animation (0 < attraction < 1).
		* @param {number} [friction=0.28] - The friction value for physics-based animation (0 < friction < 1).
		*/
		constructor({ attraction: t = .026, friction: i = .28 } = {}) {
			if (super(), !Number.isFinite(t) || t <= 0 || t >= 1) throw new Error("Attraction must be a number between 0 and 1 (exclusive).");
			if (!Number.isFinite(i) || i <= 0 || i >= 1) throw new Error("Friction must be a number between 0 and 1 (exclusive).");
			this.#t = t, this.#m = i, this.#o = 1 - i, this.#n = 0, this.#s = 0, this.#e = 0, this.isAnimating = !1, this.#r = null, this.#h = 0, this.#i = null;
		}
		/**
		* Animates from a start value to an end value.
		* @param {number} startValue - The starting value.
		* @param {number} endValue - The target value.
		* @param {number} [velocity=0] - Initial velocity.
		* @returns {Promise} Resolves when animation completes or is stopped.
		*/
		animateTo(t, i, s = 0) {
			if (!Number.isFinite(t)) throw new Error("startValue must be a finite number.");
			if (!Number.isFinite(i)) throw new Error("endValue must be a finite number.");
			if (!Number.isFinite(s)) throw new Error("velocity must be a finite number.");
			if (this.isAnimating && this.#u(), t === i && s === 0) return this.emit("change", {
				position: i,
				progress: 1
			}), this.emit("complete", {
				position: i,
				progress: 1
			}), Promise.resolve();
			this.#s = t, this.#e = i, this.#n = s, this.isAnimating = !0, this.#r = null;
			const e = ++this.#h;
			return new Promise((n) => {
				this.#i = n;
				const r = (h) => {
					if (e !== this.#h || !this.isAnimating) return;
					if (this.#r === null) {
						this.#r = h, requestAnimationFrame(r);
						return;
					}
					const o = Math.min(h - this.#r, 64) / 16.66;
					this.#r = h;
					const l = (this.#e - this.#s) * this.#t;
					this.#n += l * o, this.#n *= Math.pow(this.#o, o), this.#s += this.#n * o;
					const m = this.#e - t;
					let u = 0;
					if (m !== 0 && (u = (this.#s - t) / m), this.emit("change", {
						position: this.#s,
						progress: u
					}), Math.abs(this.#s - this.#e) < .01 && Math.abs(this.#n) < .01) {
						this.isAnimating = !1;
						const c = this.#i;
						this.#i = null, this.emit("change", {
							position: this.#e,
							progress: 1
						}), this.emit("complete", {
							position: this.#e,
							progress: 1
						}), c();
						return;
					}
					requestAnimationFrame(r);
				};
				requestAnimationFrame(r);
			});
		}
		/**
		* Internal stop — resolves Promise without emitting 'stop'.
		* Used when a new animateTo supersedes the current one.
		*/
		#u() {
			this.isAnimating = !1, this.#i && (this.#i(), this.#i = null);
		}
		/**
		* Stops the ongoing animation.
		* Emits 'stop' event and resolves the pending Promise.
		*/
		stop() {
			if (!this.isAnimating) return;
			this.isAnimating = !1, this.#h++;
			const t = this.#i;
			this.#i = null, this.emit("stop", { position: this.#s }), t && t();
		}
		/**
		* Sets the attraction value
		* @param {number} attraction - The attraction value for physics-based animation (0 < attraction < 1).
		*/
		setAttraction(t) {
			if (!Number.isFinite(t) || t <= 0 || t >= 1) throw new Error("Attraction must be a number between 0 and 1 (exclusive).");
			this.#t = t;
		}
		/**
		* Sets the friction value
		* @param {number} friction - The friction value for physics-based animation (0 < friction < 1).
		*/
		setFriction(t) {
			if (!Number.isFinite(t) || t <= 0 || t >= 1) throw new Error("Friction must be a number between 0 and 1 (exclusive).");
			this.#m = t, this.#o = 1 - t;
		}
	};
	//#endregion
	//#region node_modules/@magic-spells/frame-engine/dist/frame-engine.esm.js
	var R = /* @__PURE__ */ new Set([
		"display",
		"position",
		"float",
		"clear",
		"visibility",
		"overflow",
		"overflow-x",
		"overflow-y",
		"flex-direction",
		"flex-wrap",
		"justify-content",
		"align-items",
		"align-content",
		"order",
		"grid-template-columns",
		"grid-template-rows",
		"grid-template-areas",
		"grid-auto-flow",
		"z-index",
		"table-layout",
		"empty-cells",
		"caption-side",
		"list-style-type",
		"list-style-position",
		"pointer-events",
		"user-select",
		"box-sizing",
		"resize",
		"text-align",
		"text-transform",
		"white-space",
		"word-break",
		"word-wrap",
		"font-style",
		"font-variant",
		"background-repeat",
		"background-attachment",
		"border-style",
		"border-collapse",
		"content",
		"page-break-before",
		"page-break-after",
		"page-break-inside"
	]);
	var g = /* @__PURE__ */ new Set([
		"transform",
		"filter",
		"backdrop-filter"
	]);
	var b = {
		translateX: [{
			value: 0,
			unit: "px"
		}],
		translateY: [{
			value: 0,
			unit: "px"
		}],
		translateZ: [{
			value: 0,
			unit: "px"
		}],
		translate: [{
			value: 0,
			unit: "px"
		}, {
			value: 0,
			unit: "px"
		}],
		translate3d: [
			{
				value: 0,
				unit: "px"
			},
			{
				value: 0,
				unit: "px"
			},
			{
				value: 0,
				unit: "px"
			}
		],
		scale: [{
			value: 1,
			unit: ""
		}],
		scaleX: [{
			value: 1,
			unit: ""
		}],
		scaleY: [{
			value: 1,
			unit: ""
		}],
		scaleZ: [{
			value: 1,
			unit: ""
		}],
		scale3d: [
			{
				value: 1,
				unit: ""
			},
			{
				value: 1,
				unit: ""
			},
			{
				value: 1,
				unit: ""
			}
		],
		rotate: [{
			value: 0,
			unit: "deg"
		}],
		rotateX: [{
			value: 0,
			unit: "deg"
		}],
		rotateY: [{
			value: 0,
			unit: "deg"
		}],
		rotateZ: [{
			value: 0,
			unit: "deg"
		}],
		rotate3d: [
			{
				value: 0,
				unit: ""
			},
			{
				value: 0,
				unit: ""
			},
			{
				value: 1,
				unit: ""
			},
			{
				value: 0,
				unit: "deg"
			}
		],
		skew: [{
			value: 0,
			unit: "deg"
		}, {
			value: 0,
			unit: "deg"
		}],
		skewX: [{
			value: 0,
			unit: "deg"
		}],
		skewY: [{
			value: 0,
			unit: "deg"
		}],
		perspective: [{
			value: 0,
			unit: "px"
		}],
		blur: [{
			value: 0,
			unit: "px"
		}],
		brightness: [{
			value: 1,
			unit: ""
		}],
		contrast: [{
			value: 1,
			unit: ""
		}],
		grayscale: [{
			value: 0,
			unit: ""
		}],
		"hue-rotate": [{
			value: 0,
			unit: "deg"
		}],
		invert: [{
			value: 0,
			unit: ""
		}],
		opacity: [{
			value: 1,
			unit: ""
		}],
		saturate: [{
			value: 1,
			unit: ""
		}],
		sepia: [{
			value: 0,
			unit: ""
		}],
		"drop-shadow-1": [
			{
				value: 0,
				unit: "px"
			},
			{
				value: 0,
				unit: "px"
			},
			{
				value: 0,
				unit: "px"
			}
		],
		"drop-shadow-2": [
			{
				value: 0,
				unit: "px"
			},
			{
				value: 0,
				unit: "px"
			},
			{
				value: 0,
				unit: "px"
			}
		]
	};
	var I = {
		opacity: [0, 1],
		blur: [0, Infinity],
		brightness: [0, Infinity],
		contrast: [0, Infinity],
		grayscale: [0, 1],
		invert: [0, 1],
		sepia: [0, 1],
		saturate: [0, Infinity]
	};
	var y = {
		red: 0,
		green: 0,
		blue: 0,
		alpha: 0
	};
	var A = !1;
	function $(p, e, a) {
		return a < 0 && (a += 1), a > 1 && (a -= 1), a < 1 / 6 ? p + (e - p) * 6 * a : a < 1 / 2 ? e : a < 2 / 3 ? p + (e - p) * (2 / 3 - a) * 6 : p;
	}
	var M = {
		aliceblue: [
			240,
			248,
			255,
			1
		],
		antiquewhite: [
			250,
			235,
			215,
			1
		],
		aqua: [
			0,
			255,
			255,
			1
		],
		aquamarine: [
			127,
			255,
			212,
			1
		],
		azure: [
			240,
			255,
			255,
			1
		],
		beige: [
			245,
			245,
			220,
			1
		],
		bisque: [
			255,
			228,
			196,
			1
		],
		black: [
			0,
			0,
			0,
			1
		],
		blanchedalmond: [
			255,
			235,
			205,
			1
		],
		blue: [
			0,
			0,
			255,
			1
		],
		blueviolet: [
			138,
			43,
			226,
			1
		],
		brown: [
			165,
			42,
			42,
			1
		],
		burlywood: [
			222,
			184,
			135,
			1
		],
		cadetblue: [
			95,
			158,
			160,
			1
		],
		chartreuse: [
			127,
			255,
			0,
			1
		],
		chocolate: [
			210,
			105,
			30,
			1
		],
		coral: [
			255,
			127,
			80,
			1
		],
		cornflowerblue: [
			100,
			149,
			237,
			1
		],
		cornsilk: [
			255,
			248,
			220,
			1
		],
		crimson: [
			220,
			20,
			60,
			1
		],
		cyan: [
			0,
			255,
			255,
			1
		],
		darkblue: [
			0,
			0,
			139,
			1
		],
		darkcyan: [
			0,
			139,
			139,
			1
		],
		darkgoldenrod: [
			184,
			134,
			11,
			1
		],
		darkgray: [
			169,
			169,
			169,
			1
		],
		darkgreen: [
			0,
			100,
			0,
			1
		],
		darkgrey: [
			169,
			169,
			169,
			1
		],
		darkkhaki: [
			189,
			183,
			107,
			1
		],
		darkmagenta: [
			139,
			0,
			139,
			1
		],
		darkolivegreen: [
			85,
			107,
			47,
			1
		],
		darkorange: [
			255,
			140,
			0,
			1
		],
		darkorchid: [
			153,
			50,
			204,
			1
		],
		darkred: [
			139,
			0,
			0,
			1
		],
		darksalmon: [
			233,
			150,
			122,
			1
		],
		darkseagreen: [
			143,
			188,
			143,
			1
		],
		darkslateblue: [
			72,
			61,
			139,
			1
		],
		darkslategray: [
			47,
			79,
			79,
			1
		],
		darkslategrey: [
			47,
			79,
			79,
			1
		],
		darkturquoise: [
			0,
			206,
			209,
			1
		],
		darkviolet: [
			148,
			0,
			211,
			1
		],
		deeppink: [
			255,
			20,
			147,
			1
		],
		deepskyblue: [
			0,
			191,
			255,
			1
		],
		dimgray: [
			105,
			105,
			105,
			1
		],
		dimgrey: [
			105,
			105,
			105,
			1
		],
		dodgerblue: [
			30,
			144,
			255,
			1
		],
		firebrick: [
			178,
			34,
			34,
			1
		],
		floralwhite: [
			255,
			250,
			240,
			1
		],
		forestgreen: [
			34,
			139,
			34,
			1
		],
		fuchsia: [
			255,
			0,
			255,
			1
		],
		gainsboro: [
			220,
			220,
			220,
			1
		],
		ghostwhite: [
			248,
			248,
			255,
			1
		],
		gold: [
			255,
			215,
			0,
			1
		],
		goldenrod: [
			218,
			165,
			32,
			1
		],
		gray: [
			128,
			128,
			128,
			1
		],
		green: [
			0,
			128,
			0,
			1
		],
		greenyellow: [
			173,
			255,
			47,
			1
		],
		grey: [
			128,
			128,
			128,
			1
		],
		honeydew: [
			240,
			255,
			240,
			1
		],
		hotpink: [
			255,
			105,
			180,
			1
		],
		indianred: [
			205,
			92,
			92,
			1
		],
		indigo: [
			75,
			0,
			130,
			1
		],
		ivory: [
			255,
			255,
			240,
			1
		],
		khaki: [
			240,
			230,
			140,
			1
		],
		lavender: [
			230,
			230,
			250,
			1
		],
		lavenderblush: [
			255,
			240,
			245,
			1
		],
		lawngreen: [
			124,
			252,
			0,
			1
		],
		lemonchiffon: [
			255,
			250,
			205,
			1
		],
		lightblue: [
			173,
			216,
			230,
			1
		],
		lightcoral: [
			240,
			128,
			128,
			1
		],
		lightcyan: [
			224,
			255,
			255,
			1
		],
		lightgoldenrodyellow: [
			250,
			250,
			210,
			1
		],
		lightgray: [
			211,
			211,
			211,
			1
		],
		lightgreen: [
			144,
			238,
			144,
			1
		],
		lightgrey: [
			211,
			211,
			211,
			1
		],
		lightpink: [
			255,
			182,
			193,
			1
		],
		lightsalmon: [
			255,
			160,
			122,
			1
		],
		lightseagreen: [
			32,
			178,
			170,
			1
		],
		lightskyblue: [
			135,
			206,
			250,
			1
		],
		lightslategray: [
			119,
			136,
			153,
			1
		],
		lightslategrey: [
			119,
			136,
			153,
			1
		],
		lightsteelblue: [
			176,
			196,
			222,
			1
		],
		lightyellow: [
			255,
			255,
			224,
			1
		],
		lime: [
			0,
			255,
			0,
			1
		],
		limegreen: [
			50,
			205,
			50,
			1
		],
		linen: [
			250,
			240,
			230,
			1
		],
		magenta: [
			255,
			0,
			255,
			1
		],
		maroon: [
			128,
			0,
			0,
			1
		],
		mediumaquamarine: [
			102,
			205,
			170,
			1
		],
		mediumblue: [
			0,
			0,
			205,
			1
		],
		mediumorchid: [
			186,
			85,
			211,
			1
		],
		mediumpurple: [
			147,
			112,
			219,
			1
		],
		mediumseagreen: [
			60,
			179,
			113,
			1
		],
		mediumslateblue: [
			123,
			104,
			238,
			1
		],
		mediumspringgreen: [
			0,
			250,
			154,
			1
		],
		mediumturquoise: [
			72,
			209,
			204,
			1
		],
		mediumvioletred: [
			199,
			21,
			133,
			1
		],
		midnightblue: [
			25,
			25,
			112,
			1
		],
		mintcream: [
			245,
			255,
			250,
			1
		],
		mistyrose: [
			255,
			228,
			225,
			1
		],
		moccasin: [
			255,
			228,
			181,
			1
		],
		navajowhite: [
			255,
			222,
			173,
			1
		],
		navy: [
			0,
			0,
			128,
			1
		],
		oldlace: [
			253,
			245,
			230,
			1
		],
		olive: [
			128,
			128,
			0,
			1
		],
		olivedrab: [
			107,
			142,
			35,
			1
		],
		orange: [
			255,
			165,
			0,
			1
		],
		orangered: [
			255,
			69,
			0,
			1
		],
		orchid: [
			218,
			112,
			214,
			1
		],
		palegoldenrod: [
			238,
			232,
			170,
			1
		],
		palegreen: [
			152,
			251,
			152,
			1
		],
		paleturquoise: [
			175,
			238,
			238,
			1
		],
		palevioletred: [
			219,
			112,
			147,
			1
		],
		papayawhip: [
			255,
			239,
			213,
			1
		],
		peachpuff: [
			255,
			218,
			185,
			1
		],
		peru: [
			205,
			133,
			63,
			1
		],
		pink: [
			255,
			192,
			203,
			1
		],
		plum: [
			221,
			160,
			221,
			1
		],
		powderblue: [
			176,
			224,
			230,
			1
		],
		purple: [
			128,
			0,
			128,
			1
		],
		rebeccapurple: [
			102,
			51,
			153,
			1
		],
		red: [
			255,
			0,
			0,
			1
		],
		rosybrown: [
			188,
			143,
			143,
			1
		],
		royalblue: [
			65,
			105,
			225,
			1
		],
		saddlebrown: [
			139,
			69,
			19,
			1
		],
		salmon: [
			250,
			128,
			114,
			1
		],
		sandybrown: [
			244,
			164,
			96,
			1
		],
		seagreen: [
			46,
			139,
			87,
			1
		],
		seashell: [
			255,
			245,
			238,
			1
		],
		sienna: [
			160,
			82,
			45,
			1
		],
		silver: [
			192,
			192,
			192,
			1
		],
		skyblue: [
			135,
			206,
			235,
			1
		],
		slateblue: [
			106,
			90,
			205,
			1
		],
		slategray: [
			112,
			128,
			144,
			1
		],
		slategrey: [
			112,
			128,
			144,
			1
		],
		snow: [
			255,
			250,
			250,
			1
		],
		springgreen: [
			0,
			255,
			127,
			1
		],
		steelblue: [
			70,
			130,
			180,
			1
		],
		tan: [
			210,
			180,
			140,
			1
		],
		teal: [
			0,
			128,
			128,
			1
		],
		thistle: [
			216,
			191,
			216,
			1
		],
		tomato: [
			255,
			99,
			71,
			1
		],
		turquoise: [
			64,
			224,
			208,
			1
		],
		violet: [
			238,
			130,
			238,
			1
		],
		wheat: [
			245,
			222,
			179,
			1
		],
		white: [
			255,
			255,
			255,
			1
		],
		whitesmoke: [
			245,
			245,
			245,
			1
		],
		yellow: [
			255,
			255,
			0,
			1
		],
		yellowgreen: [
			154,
			205,
			50,
			1
		],
		transparent: [
			0,
			0,
			0,
			0
		]
	};
	var C = class {
		/**
		* @param {Keyframes} keyframes - Object mapping percent positions to CSS styles
		*/
		constructor(e) {
			this.setKeyframes(e);
		}
		/**
		* Replace the current keyframes and re-parse all values.
		* @param {Keyframes} keyframes - Object mapping percent positions (0-100) to CSS styles
		*/
		setKeyframes(e) {
			this.keyframes = Object.keys(e).map(Number).sort((n, r) => n - r).map((n) => ({
				percent: n,
				values: this.flatten(e[n])
			}));
			const a = {};
			for (const n of g) a[n] = /* @__PURE__ */ new Set();
			for (const n of this.keyframes) for (const r in n.values) {
				const t = r.indexOf(":");
				if (t === -1) continue;
				const s = r.substring(0, t), i = r.substring(t + 1);
				i !== "__order" && g.has(s) && a[s].add(i);
			}
			for (const n of g) {
				if (a[n].size === 0) continue;
				const r = `${n}:__order`;
				for (const t of this.keyframes) {
					if (!(r in t.values)) {
						t.values[r] = {
							discrete: !0,
							value: [...a[n]]
						};
						for (const i of a[n]) {
							const l = `${n}:${i}`, u = b[i] || [{
								value: 0,
								unit: ""
							}];
							t.values[l] = { args: u.map((c) => ({ ...c })) }, i.startsWith("drop-shadow-") && (t.values[l].color = { ...y });
						}
						continue;
					}
					for (const i of a[n]) {
						const l = `${n}:${i}`;
						if (!(l in t.values)) {
							const u = b[i] || [{
								value: 0,
								unit: ""
							}];
							t.values[l] = { args: u.map((c) => ({ ...c })) }, i.startsWith("drop-shadow-") && (t.values[l].color = { ...y }), t.values[r].value.includes(i) || t.values[r].value.push(i);
						}
					}
				}
			}
			this._allKeys = /* @__PURE__ */ new Set();
			for (const n of this.keyframes) for (const r in n.values) r.endsWith(":__order") || this._allKeys.add(r);
			this._keyFrames = {};
			for (const n of this._allKeys) this._keyFrames[n] = this.keyframes.filter((r) => n in r.values);
			this._orders = {};
			for (const n of g) {
				const r = `${n}:__order`, t = this.keyframes.filter((l) => r in l.values);
				if (t.length === 0) continue;
				const s = /* @__PURE__ */ new Set(), i = [];
				for (const l of t) for (const u of l.values[r].value) s.has(u) || (s.add(u), i.push(u));
				this._orders[n] = i;
			}
		}
		/**
		* Parse a keyframe's style object into an internal representation.
		* Function-list properties (transform, filter) are expanded into individual
		* keyed entries. Colors are parsed to RGBA. Discrete properties are wrapped.
		* @param {Object<string, string|number>} styles - Raw CSS property/value pairs
		* @returns {Object<string, NumericValue|ColorValue|DiscreteValue|MultiArgValue>}
		*/
		flatten(e) {
			const a = {};
			for (const n in e) if (g.has(n)) Object.assign(a, this.flattenFunctions(n, e[n]));
			else if (this.isColor(e[n])) a[n] = this.parseColor(e[n]) || {
				discrete: !0,
				value: e[n]
			};
			else if (R.has(n)) a[n] = {
				discrete: !0,
				value: e[n]
			};
			else a[n] = this.parseValue(e[n]) || {
				discrete: !0,
				value: e[n]
			};
			return a;
		}
		/**
		* Expand a function-list property (e.g. "transform") into individual keyed entries.
		* "transform:translateX", "transform:scale", etc., plus a "__order" key.
		* @param {string} parent - The parent property name (e.g. "transform")
		* @param {string} str - The raw CSS function string (e.g. "translateX(10px) scale(2)")
		* @returns {Object<string, MultiArgValue|DiscreteValue>}
		*/
		flattenFunctions(e, a) {
			const n = {}, r = [], t = {};
			for (const { name: s, args: i, color: l } of this.parseFunctions(a)) {
				let u = s;
				if (s === "drop-shadow") {
					if (t[s] = (t[s] || 0) + 1, t[s] > 2) {
						A || (A = !0, console.warn("FrameEngine: Only the first 2 drop-shadow functions per keyframe are interpolated. Additional drop-shadows are ignored."));
						continue;
					}
					u = `${s}-${t[s]}`;
				}
				const c = { args: i };
				l && (c.color = l), n[`${e}:${u}`] = c, r.push(u);
			}
			return n[`${e}:__order`] = {
				discrete: !0,
				value: r
			}, n;
		}
		/**
		* Parse a CSS function string into an array of function name/arg pairs.
		* Uses a character-walking parser to handle nested parentheses.
		* @param {string} str - e.g. "translateX(10px) rotate(45deg)"
		* @returns {{ name: string, args: NumericValue[] }[]}
		*/
		parseFunctions(e) {
			const a = [];
			let n = 0;
			const r = e.length;
			for (; n < r;) {
				for (; n < r && /\s/.test(e[n]);) n++;
				if (n >= r) break;
				let t = "";
				for (; n < r && /[\w-]/.test(e[n]);) t += e[n], n++;
				if (!t || n >= r || e[n] !== "(") continue;
				n++;
				let s = 1, i = "";
				for (; n < r && s > 0;) {
					if (e[n] === "(") s++;
					else if (e[n] === ")" && (s--, s === 0)) {
						n++;
						break;
					}
					i += e[n], n++;
				}
				if (t === "drop-shadow") {
					const l = this.splitArgs(i), u = [];
					let c = null;
					for (const o of l) if (this.isColor(o)) {
						const d = this.parseColor(o);
						d && (c = d);
					} else {
						const d = o.match(/^(-?\d*\.?\d+)(\D*)$/);
						u.push(d ? {
							value: parseFloat(d[1]),
							unit: d[2]
						} : {
							value: 0,
							unit: ""
						});
					}
					a.push({
						name: t,
						args: u,
						color: c
					});
				} else {
					const l = i.split(/\s*,\s*|\s+/).map((u) => {
						const c = u.match(/^(-?\d*\.?\d+)(\D*)$/);
						return c ? {
							value: parseFloat(c[1]),
							unit: c[2]
						} : {
							value: 0,
							unit: ""
						};
					});
					a.push({
						name: t,
						args: l
					});
				}
			}
			return a;
		}
		/**
		* Paren-aware argument splitter for CSS functions.
		* Splits on spaces/commas at depth 0, preserving nested parens.
		* @param {string} argStr
		* @returns {string[]}
		*/
		splitArgs(e) {
			const a = [];
			let n = "", r = 0;
			for (let t = 0; t < e.length; t++) {
				const s = e[t];
				s === "(" ? r++ : s === ")" && r--, r === 0 && (s === " " || s === ",") ? (n.trim() && a.push(n.trim()), n = "") : n += s;
			}
			return n.trim() && a.push(n.trim()), a;
		}
		/**
		* Parse a single CSS value into a numeric value and unit.
		* @param {string|number} value - e.g. "10px", "45deg", 42
		* @returns {NumericValue|null} Parsed value or null if not numeric
		*/
		parseValue(e) {
			if (typeof e == "number") return {
				value: e,
				unit: ""
			};
			const a = String(e).match(/^(-?\d*\.?\d+)(\D*)$/);
			return a ? {
				value: parseFloat(a[1]),
				unit: a[2]
			} : null;
		}
		/**
		* Parse a CSS color string into a ColorValue object.
		* @param {string} color - e.g. "#ff0", "#ff0000", "rgb(255,0,0)", "rgba(255,0,0,0.5)", "hsl(120,50%,50%)"
		* @returns {ColorValue}
		*/
		parseColor(e) {
			const a = this.colorToRGBA(e);
			if (!a) return null;
			const [n, r, t, s] = a;
			return {
				red: n,
				green: r,
				blue: t,
				alpha: s
			};
		}
		/**
		* Convert a CSS color string to an [r, g, b, a] tuple.
		* Supports #rgb, #rgba, #rrggbb, #rrggbbaa, rgb(), rgba(), hsl(), hsla() formats.
		* @param {string} color
		* @returns {[number, number, number, number]}
		*/
		colorToRGBA(e) {
			if (typeof e != "string") return null;
			const a = M[e.toLowerCase()];
			if (a) return a;
			if (/^#[0-9A-Fa-f]{3}$/.test(e)) return [
				parseInt(e[1] + e[1], 16),
				parseInt(e[2] + e[2], 16),
				parseInt(e[3] + e[3], 16),
				1
			];
			if (/^#[0-9A-Fa-f]{4}$/.test(e)) return [
				parseInt(e[1] + e[1], 16),
				parseInt(e[2] + e[2], 16),
				parseInt(e[3] + e[3], 16),
				parseInt(e[4] + e[4], 16) / 255
			];
			if (/^#[0-9A-Fa-f]{6}$/.test(e)) return [
				parseInt(e.slice(1, 3), 16),
				parseInt(e.slice(3, 5), 16),
				parseInt(e.slice(5, 7), 16),
				1
			];
			if (/^#[0-9A-Fa-f]{8}$/.test(e)) return [
				parseInt(e.slice(1, 3), 16),
				parseInt(e.slice(3, 5), 16),
				parseInt(e.slice(5, 7), 16),
				parseInt(e.slice(7, 9), 16) / 255
			];
			const n = e.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
			if (n) return [
				parseInt(n[1], 10),
				parseInt(n[2], 10),
				parseInt(n[3], 10),
				n[4] !== void 0 ? parseFloat(n[4]) : 1
			];
			const r = e.match(/^rgba?\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([\d.]+)\s*)?\)$/);
			if (r) return [
				parseInt(r[1], 10),
				parseInt(r[2], 10),
				parseInt(r[3], 10),
				r[4] !== void 0 ? parseFloat(r[4]) : 1
			];
			const t = e.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)$/);
			if (t) return this._hslToRgba(parseFloat(t[1]), parseFloat(t[2]), parseFloat(t[3]), t[4] !== void 0 ? parseFloat(t[4]) : 1);
			const s = e.match(/^hsla?\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*(?:\/\s*([\d.]+)\s*)?\)$/);
			return s ? this._hslToRgba(parseFloat(s[1]), parseFloat(s[2]), parseFloat(s[3]), s[4] !== void 0 ? parseFloat(s[4]) : 1) : null;
		}
		_hslToRgba(e, a, n, r) {
			const t = e / 360, s = a / 100, i = n / 100;
			if (s === 0) {
				const c = Math.round(i * 255);
				return [
					c,
					c,
					c,
					r
				];
			}
			const l = i < .5 ? i * (1 + s) : i + s - i * s, u = 2 * i - l;
			return [
				Math.round($(u, l, t + 1 / 3) * 255),
				Math.round($(u, l, t) * 255),
				Math.round($(u, l, t - 1 / 3) * 255),
				r
			];
		}
		/**
		* Test whether a value looks like a CSS color.
		* @param {*} value
		* @returns {boolean}
		*/
		isColor(e) {
			return typeof e != "string" ? !1 : /^(#[0-9A-Fa-f]{3}$|#[0-9A-Fa-f]{4}$|#[0-9A-Fa-f]{6}$|#[0-9A-Fa-f]{8}$|rgba?\s*\(|hsla?\s*\()/.test(e) ? !0 : e.toLowerCase() in M;
		}
		/**
		* Linear interpolation between two numbers.
		* @param {number} start
		* @param {number} end
		* @param {number} factor - 0 = start, 1 = end, extrapolates outside [0,1]
		* @returns {number}
		*/
		lerp(e, a, n) {
			return e + (a - e) * n;
		}
		/**
		* Interpolate between two colors, clamping each channel.
		* @param {ColorValue} start
		* @param {ColorValue} end
		* @param {number} factor
		* @returns {ColorValue}
		*/
		lerpColor(e, a, n) {
			const r = (t, s, i) => Math.min(i, Math.max(s, t));
			return {
				red: Math.round(r(this.lerp(e.red, a.red, n), 0, 255)),
				green: Math.round(r(this.lerp(e.green, a.green, n), 0, 255)),
				blue: Math.round(r(this.lerp(e.blue, a.blue, n), 0, 255)),
				alpha: parseFloat(r(this.lerp(e.alpha, a.alpha, n), 0, 1).toFixed(4))
			};
		}
		/**
		* Format a number to at most 4 decimal places, stripping trailing zeros.
		* @param {number} num
		* @returns {string}
		*/
		format(e) {
			return parseFloat(e.toFixed(4)).toString();
		}
		/**
		* Find the two surrounding keyframes and the interpolation factor for a given percent.
		* Extrapolates when percent is outside the keyframe range.
		* @param {{ percent: number, values: Object }[]} frames - Keyframes that contain a given property
		* @param {number} percent - The current position (0-100)
		* @returns {{ from: Object, to: Object, factor: number }|null}
		*/
		findFramesAndFactor(e, a) {
			if (e.length === 0) return null;
			if (e.length === 1) return {
				from: e[0],
				to: e[0],
				factor: 0
			};
			const n = e[0], r = e[e.length - 1];
			if (a <= n.percent) {
				const t = e[1].percent - n.percent;
				return {
					from: n,
					to: e[1],
					factor: t === 0 ? 1 : (a - n.percent) / t
				};
			}
			if (a >= r.percent) {
				const t = e[e.length - 2], s = r.percent - t.percent;
				return {
					from: t,
					to: r,
					factor: s === 0 ? 1 : (a - t.percent) / s
				};
			}
			for (let t = 0; t < e.length - 1; t++) if (a >= e[t].percent && a <= e[t + 1].percent) {
				const s = e[t + 1].percent - e[t].percent;
				return {
					from: e[t],
					to: e[t + 1],
					factor: s === 0 ? 1 : (a - e[t].percent) / s
				};
			}
			return {
				from: r,
				to: r,
				factor: 0
			};
		}
		/**
		* Get the active discrete value for a property at a given percent.
		* Returns the value from the last keyframe at or before the percent.
		* @param {string} key - The flattened property key
		* @param {number} percent - The current position (0-100)
		* @returns {*}
		*/
		getDiscrete(e, a) {
			const n = this._keyFrames[e] || this.keyframes.filter((t) => e in t.values);
			if (n.length === 0) return null;
			let r = n[0];
			for (const t of n) if (t.percent <= a) r = t;
			else break;
			return r.values[e].value;
		}
		/**
		* Get the default (identity) value for a CSS function.
		* Used as a fallback when a function appears in one keyframe but not another.
		* @param {string} key - The flattened key (e.g. "transform:translateX")
		* @returns {NumericValue[]}
		*/
		getDefault(e) {
			const a = e.split(":")[1];
			return a && b[a] ? b[a] : [{
				value: 0,
				unit: ""
			}];
		}
		/**
		* Calculate interpolated CSS styles at a given position.
		* @param {number} pos - Animation position where 0 = start, 1 = end. Values outside 0-1 extrapolate.
		* @returns {InterpolatedStyles} An object of CSS property names to their computed string values.
		*/
		getFrame(e) {
			const a = e * 100, n = this._allKeys, r = {};
			for (const t of n) {
				const s = this._keyFrames[t];
				if (!s || s.length === 0) continue;
				const i = s[0].values[t];
				if (i && i.discrete) {
					r[t] = this.getDiscrete(t, a);
					continue;
				}
				const { from: l, to: u, factor: c } = this.findFramesAndFactor(s, a), o = l.values[t], d = u.values[t];
				if (o && "red" in o) {
					r[t] = this.lerpColor(o, d, c);
					continue;
				}
				if (o && o.args) {
					const m = d.args || this.getDefault(t), h = this.getDefault(t), v = Math.max(o.args.length, m.length), k = [];
					for (let f = 0; f < v; f++) {
						const x = o.args[f] || h[f] || {
							value: 0,
							unit: ""
						}, _ = m[f] || h[f] || {
							value: 0,
							unit: ""
						};
						k.push({
							value: this.lerp(x.value, _.value, c),
							unit: x.unit || _.unit
						});
					}
					const w = I[t.includes(":") ? t.substring(t.indexOf(":") + 1) : t];
					if (w) for (const f of k) f.value = Math.min(w[1], Math.max(w[0], f.value));
					const F = { args: k };
					(o.color || d.color) && (F.color = this.lerpColor(o.color || y, d.color || y, c)), r[t] = F;
					continue;
				}
				if (o && "value" in o) {
					const m = d || this.getDefault(t)[0];
					let h = this.lerp(o.value, m.value, c);
					const v = I[t];
					v && (h = Math.min(v[1], Math.max(v[0], h))), r[t] = {
						value: h,
						unit: o.unit
					};
				}
			}
			return this.toStyles(r);
		}
		/**
		* Convert the internal interpolated results into a flat CSS styles object.
		* Reassembles function-list properties (transform, filter) from their individual parts.
		* @param {Object<string, NumericValue|ColorValue|MultiArgValue|*>} results
		* @returns {InterpolatedStyles}
		*/
		toStyles(e) {
			const a = {}, n = {};
			for (const r in e) {
				const t = e[r], s = r.indexOf(":");
				if (s !== -1) {
					const i = r.substring(0, s), l = r.substring(s + 1);
					if (g.has(i)) {
						if (n[i] || (n[i] = {}), t.args) if (l.startsWith("drop-shadow-")) {
							const u = l.replace(/-\d+$/, ""), c = t.args.map((o) => `${this.format(o.value)}${o.unit}`).join(" ");
							if (t.color) {
								const o = t.color, d = o.alpha < 1 ? `rgba(${o.red},${o.green},${o.blue},${o.alpha})` : `rgb(${o.red},${o.green},${o.blue})`;
								n[i][l] = `${u}(${c} ${d})`;
							} else n[i][l] = `${u}(${c})`;
						} else n[i][l] = `${l}(${t.args.map((u) => `${this.format(u.value)}${u.unit}`).join(", ")})`;
						else n[i][l] = `${l}(${this.format(t.value)}${t.unit})`;
						continue;
					}
				}
				if (typeof t == "string" || typeof t == "number") {
					a[r] = t;
					continue;
				}
				if (t && "red" in t) {
					a[r] = t.alpha < 1 ? `rgba(${t.red},${t.green},${t.blue},${t.alpha})` : `rgb(${t.red},${t.green},${t.blue})`;
					continue;
				}
				if (t && "value" in t) {
					a[r] = `${this.format(t.value)}${t.unit}`;
					continue;
				}
				a[r] = t;
			}
			for (const r in n) {
				const t = n[r], i = (this._orders[r] || Object.keys(t)).filter((l) => t[l]).map((l) => t[l]);
				i.length > 0 && (a[r] = i.join(" "));
			}
			return a;
		}
	};
	//#endregion
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
	* reverses the spring in place. Emits: show, hide, change, shown, hidden, stop.
	*/
	var MorphEngine = class extends EventEmitter {
		#spring;
		#frames = null;
		#blob = null;
		#cloneWrapper = null;
		#styleProperties;
		#state = "idle";
		#p = 0;
		#resolveRun = null;
		#sourceElement = null;
		#targetElement = null;
		#displayOverride = null;
		#savedInline = /* @__PURE__ */ new Map();
		#savedBodyOverflow = null;
		#fromMeasure = null;
		#toMeasure = null;
		#toElement = null;
		#shownPosition = TRAVEL;
		#revealed = false;
		#revealStart = .75;
		#revealFull = .875;
		#sourceRevealed = false;
		#sourceRevealUntil = .25;
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
		* @param {boolean} [options.lockScroll=true] - Lock body scroll from show until fully
		*   hidden — a scroll mid-morph would strand the fixed-position blob
		* @param {number} [options.zIndex=9999] - Blob z-index
		*/
		constructor({ attraction = .1, friction = .32, styleProperties = DEFAULT_STYLE_PROPERTIES, revealAt = .75, sourceRevealUntil = .25, cloneFadeUntil = .25, cloneContents = true, lockScroll = true, zIndex = 9999 } = {}) {
			super();
			this.#spring = new b$1({
				attraction,
				friction
			});
			this.#styleProperties = styleProperties;
			this.revealAt = revealAt;
			this.sourceRevealUntil = sourceRevealUntil;
			this.cloneFadeUntil = cloneFadeUntil;
			this.cloneContents = cloneContents;
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
		* @returns {Promise<boolean>} true when settled, false if superseded or rejected
		*/
		show({ from, to, display = null } = {}) {
			if (this.#state === "showing" || this.#state === "shown") {
				console.warn(`MorphEngine: show() ignored — already ${this.#state}`);
				return Promise.resolve(false);
			}
			if (this.#state === "hiding") return this.#reverse("showing");
			if (!from || !to) throw new Error("MorphEngine: show() requires { from, to } elements.");
			this.#sourceElement = from;
			this.#targetElement = to;
			this.#displayOverride = display;
			this.#saveInline(from);
			this.#saveInline(to);
			if (this.lockScroll) {
				this.#savedBodyOverflow = document.body.style.overflow;
				document.body.style.overflow = "hidden";
			}
			return this.#morph(from, to, "showing");
		}
		/**
		* Morphs back from the target to the source. Called while showing, it
		* reverses the in-flight morph.
		* @returns {Promise<boolean>} true when settled, false if superseded or rejected
		*/
		hide() {
			if (this.#state === "idle" || this.#state === "hiding") {
				console.warn(`MorphEngine: hide() ignored — ${this.#state}`);
				return Promise.resolve(false);
			}
			if (this.#state === "showing") return this.#reverse("hiding");
			return this.#morph(this.#targetElement, this.#sourceElement, "hiding");
		}
		/**
		* Aborts any morph and restores both elements to their pre-show resting state.
		*/
		stop() {
			if (this.#state === "idle") return;
			this.#supersede();
			this.#spring.stop();
			this.#removeBlob();
			const source = this.#sourceElement;
			const target = this.#targetElement;
			if (source) {
				this.#restoreInline(source);
				source.removeAttribute("morphing");
			}
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
		* Stops and removes all listeners. The engine is unusable afterwards.
		*/
		destroy() {
			this.stop();
			this.#spring.removeAllListeners();
			this.removeAllListeners();
		}
		/** @param {number} attraction - Spring attraction (0, 1) exclusive, live-tunable */
		setAttraction(attraction) {
			this.#spring.setAttraction(attraction);
		}
		/** @param {number} friction - Spring friction (0, 1) exclusive, live-tunable */
		setFriction(friction) {
			this.#spring.setFriction(friction);
		}
		/**
		* The single morph routine — show and hide are the same mechanics with the
		* roles swapped. The blob starts pixel-identical to fromElement (its content
		* cloned and frozen on top), springs to toElement's rect and styles, and
		* reveals toElement across the final stretch.
		*/
		#morph(fromElement, toElement, phase) {
			this.#supersede();
			const fromMeasure = this.#measure(fromElement);
			const toMeasure = this.#measure(toElement);
			this.#fromMeasure = fromMeasure;
			this.#toMeasure = toMeasure;
			this.#toElement = toElement;
			this.#shownPosition = phase === "showing" ? TRAVEL : 0;
			this.#state = phase;
			this.#revealed = false;
			this.#sourceRevealed = false;
			this.#revealStart = this.revealAt;
			this.#revealFull = this.revealAt + (1 - this.revealAt) / 2;
			this.#sourceRevealUntil = this.sourceRevealUntil;
			this.#reconcileBorderColors(fromMeasure, toMeasure);
			this.#frames = new C(this.#buildKeyframes(fromMeasure, toMeasure));
			this.#removeBlob();
			this.#createBlob(fromMeasure, toMeasure);
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
		#reverse(newPhase) {
			this.#supersede();
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
		#unlockScroll() {
			if (this.#savedBodyOverflow === null) return;
			document.body.style.overflow = this.#savedBodyOverflow;
			this.#savedBodyOverflow = null;
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
				const fade = this.cloneFadeUntil > 0 ? clamp(1 - p / this.cloneFadeUntil, 0, 1) : p <= 0 ? 1 : 0;
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
		#createBlob(fromMeasure, toMeasure) {
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
			if (this.cloneContents) this.#createClone(blob, fromMeasure);
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
	exports.MorphEngine = MorphEngine;
});

//# sourceMappingURL=morph-engine.js.map