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
	var b = class extends f {
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
	var e = /* @__PURE__ */ new Set(/* @__PURE__ */ "display.position.float.clear.visibility.overflow.overflow-x.overflow-y.flex-direction.flex-wrap.justify-content.align-items.align-content.order.grid-template-columns.grid-template-rows.grid-template-areas.grid-auto-flow.z-index.table-layout.empty-cells.caption-side.list-style-type.list-style-position.pointer-events.user-select.box-sizing.resize.text-align.text-transform.white-space.word-break.word-wrap.font-style.font-variant.background-repeat.background-attachment.border-style.border-collapse.content.page-break-before.page-break-after.page-break-inside".split("."));
	var t = /* @__PURE__ */ new Set([
		"transform",
		"filter",
		"backdrop-filter"
	]);
	var n = {
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
	var r = {
		opacity: [0, 1],
		blur: [0, Infinity],
		brightness: [0, Infinity],
		contrast: [0, Infinity],
		grayscale: [0, 1],
		invert: [0, 1],
		sepia: [0, 1],
		saturate: [0, Infinity]
	};
	var i = {
		red: 0,
		green: 0,
		blue: 0,
		alpha: 0
	};
	var a = !1;
	function o(e, t, n) {
		return n < 0 && (n += 1), n > 1 && --n, n < 1 / 6 ? e + (t - e) * 6 * n : n < 1 / 2 ? t : n < 2 / 3 ? e + (t - e) * (2 / 3 - n) * 6 : e;
	}
	var s = {
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
	var c = class {
		constructor(e) {
			this.setKeyframes(e);
		}
		setKeyframes(e) {
			this.keyframes = Object.keys(e).map(Number).sort((e, t) => e - t).map((t) => ({
				percent: t,
				values: this.flatten(e[t])
			}));
			let r = {};
			for (let e of t) r[e] = /* @__PURE__ */ new Set();
			for (let e of this.keyframes) for (let n in e.values) {
				let e = n.indexOf(":");
				if (e === -1) continue;
				let i = n.substring(0, e), a = n.substring(e + 1);
				a !== "__order" && t.has(i) && r[i].add(a);
			}
			for (let e of t) {
				if (r[e].size === 0) continue;
				let t = `${e}:__order`;
				for (let a of this.keyframes) {
					if (!(t in a.values)) {
						a.values[t] = {
							discrete: !0,
							value: [...r[e]]
						};
						for (let t of r[e]) {
							let r = `${e}:${t}`, o = n[t] || [{
								value: 0,
								unit: ""
							}];
							a.values[r] = { args: o.map((e) => ({ ...e })) }, t.startsWith("drop-shadow-") && (a.values[r].color = { ...i });
						}
						continue;
					}
					for (let o of r[e]) {
						let r = `${e}:${o}`;
						if (!(r in a.values)) {
							let e = n[o] || [{
								value: 0,
								unit: ""
							}];
							a.values[r] = { args: e.map((e) => ({ ...e })) }, o.startsWith("drop-shadow-") && (a.values[r].color = { ...i }), a.values[t].value.includes(o) || a.values[t].value.push(o);
						}
					}
				}
			}
			this._allKeys = /* @__PURE__ */ new Set();
			for (let e of this.keyframes) for (let t in e.values) t.endsWith(":__order") || this._allKeys.add(t);
			this._keyFrames = {};
			for (let e of this._allKeys) this._keyFrames[e] = this.keyframes.filter((t) => e in t.values);
			this._orders = {};
			for (let e of t) {
				let t = `${e}:__order`, n = this.keyframes.filter((e) => t in e.values);
				if (n.length === 0) continue;
				let r = /* @__PURE__ */ new Set(), i = [];
				for (let e of n) for (let n of e.values[t].value) r.has(n) || (r.add(n), i.push(n));
				this._orders[e] = i;
			}
		}
		flatten(n) {
			let r = {};
			for (let i in n) t.has(i) ? Object.assign(r, this.flattenFunctions(i, n[i])) : this.isColor(n[i]) ? r[i] = this.parseColor(n[i]) || {
				discrete: !0,
				value: n[i]
			} : e.has(i) ? r[i] = {
				discrete: !0,
				value: n[i]
			} : r[i] = this.parseValue(n[i]) || {
				discrete: !0,
				value: n[i]
			};
			return r;
		}
		flattenFunctions(e, t) {
			let n = {}, r = [], i = {};
			for (let { name: o, args: s, color: c } of this.parseFunctions(t)) {
				let t = o;
				if (o === "drop-shadow") {
					if (i[o] = (i[o] || 0) + 1, i[o] > 2) {
						a || (a = !0, console.warn("FrameEngine: Only the first 2 drop-shadow functions per keyframe are interpolated. Additional drop-shadows are ignored."));
						continue;
					}
					t = `${o}-${i[o]}`;
				}
				let l = { args: s };
				c && (l.color = c), n[`${e}:${t}`] = l, r.push(t);
			}
			return n[`${e}:__order`] = {
				discrete: !0,
				value: r
			}, n;
		}
		parseFunctions(e) {
			let t = [], n = 0, r = e.length;
			for (; n < r;) {
				for (; n < r && /\s/.test(e[n]);) n++;
				if (n >= r) break;
				let i = "";
				for (; n < r && /[\w-]/.test(e[n]);) i += e[n], n++;
				if (!i || n >= r || e[n] !== "(") continue;
				n++;
				let a = 1, o = "";
				for (; n < r && a > 0;) {
					if (e[n] === "(") a++;
					else if (e[n] === ")" && (a--, a === 0)) {
						n++;
						break;
					}
					o += e[n], n++;
				}
				if (i === "drop-shadow") {
					let e = this.splitArgs(o), n = [], r = null;
					for (let t of e) if (this.isColor(t)) {
						let e = this.parseColor(t);
						e && (r = e);
					} else {
						let e = t.match(/^(-?\d*\.?\d+)(\D*)$/);
						n.push(e ? {
							value: parseFloat(e[1]),
							unit: e[2]
						} : {
							value: 0,
							unit: ""
						});
					}
					t.push({
						name: i,
						args: n,
						color: r
					});
				} else {
					let e = o.split(/\s*,\s*|\s+/).map((e) => {
						let t = e.match(/^(-?\d*\.?\d+)(\D*)$/);
						return t ? {
							value: parseFloat(t[1]),
							unit: t[2]
						} : {
							value: 0,
							unit: ""
						};
					});
					t.push({
						name: i,
						args: e
					});
				}
			}
			return t;
		}
		splitArgs(e) {
			let t = [], n = "", r = 0;
			for (let i = 0; i < e.length; i++) {
				let a = e[i];
				a === "(" ? r++ : a === ")" && r--, r === 0 && (a === " " || a === ",") ? (n.trim() && t.push(n.trim()), n = "") : n += a;
			}
			return n.trim() && t.push(n.trim()), t;
		}
		parseValue(e) {
			if (typeof e == "number") return {
				value: e,
				unit: ""
			};
			let t = String(e).match(/^(-?\d*\.?\d+)(\D*)$/);
			return t ? {
				value: parseFloat(t[1]),
				unit: t[2]
			} : null;
		}
		parseColor(e) {
			let t = this.colorToRGBA(e);
			if (!t) return null;
			let [n, r, i, a] = t;
			return {
				red: n,
				green: r,
				blue: i,
				alpha: a
			};
		}
		colorToRGBA(e) {
			if (typeof e != "string") return null;
			let t = s[e.toLowerCase()];
			if (t) return t;
			let n = e.match(/^color\(\s*srgb\s+([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?)\s+([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?)\s+([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?)(?:\s*\/\s*([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?)(%)?)?\s*\)$/i);
			if (n) {
				let e = n[4] === void 0 ? 1 : parseFloat(n[4]) / (n[5] ? 100 : 1);
				return [
					parseFloat(n[1]) * 255,
					parseFloat(n[2]) * 255,
					parseFloat(n[3]) * 255,
					e
				];
			}
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
			let r = e.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
			if (r) return [
				parseInt(r[1], 10),
				parseInt(r[2], 10),
				parseInt(r[3], 10),
				r[4] === void 0 ? 1 : parseFloat(r[4])
			];
			let i = e.match(/^rgba?\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([\d.]+)\s*)?\)$/);
			if (i) return [
				parseInt(i[1], 10),
				parseInt(i[2], 10),
				parseInt(i[3], 10),
				i[4] === void 0 ? 1 : parseFloat(i[4])
			];
			let a = e.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)$/);
			if (a) return this._hslToRgba(parseFloat(a[1]), parseFloat(a[2]), parseFloat(a[3]), a[4] === void 0 ? 1 : parseFloat(a[4]));
			let o = e.match(/^hsla?\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*(?:\/\s*([\d.]+)\s*)?\)$/);
			return o ? this._hslToRgba(parseFloat(o[1]), parseFloat(o[2]), parseFloat(o[3]), o[4] === void 0 ? 1 : parseFloat(o[4])) : null;
		}
		_hslToRgba(e, t, n, r) {
			let i = e / 360, a = t / 100, s = n / 100;
			if (a === 0) {
				let e = Math.round(s * 255);
				return [
					e,
					e,
					e,
					r
				];
			}
			let c = s < .5 ? s * (1 + a) : s + a - s * a, l = 2 * s - c;
			return [
				Math.round(o(l, c, i + 1 / 3) * 255),
				Math.round(o(l, c, i) * 255),
				Math.round(o(l, c, i - 1 / 3) * 255),
				r
			];
		}
		isColor(e) {
			return typeof e == "string" ? /^(#[0-9A-Fa-f]{3}$|#[0-9A-Fa-f]{4}$|#[0-9A-Fa-f]{6}$|#[0-9A-Fa-f]{8}$|rgba?\s*\(|hsla?\s*\()/.test(e) || /^color\(\s*srgb\s/i.test(e) ? !0 : e.toLowerCase() in s : !1;
		}
		lerp(e, t, n) {
			return e + (t - e) * n;
		}
		lerpColor(e, t, n) {
			let r = (e, t, n) => Math.min(n, Math.max(t, e));
			return {
				red: Math.round(r(this.lerp(e.red, t.red, n), 0, 255)),
				green: Math.round(r(this.lerp(e.green, t.green, n), 0, 255)),
				blue: Math.round(r(this.lerp(e.blue, t.blue, n), 0, 255)),
				alpha: parseFloat(r(this.lerp(e.alpha, t.alpha, n), 0, 1).toFixed(4))
			};
		}
		format(e) {
			return parseFloat(e.toFixed(4)).toString();
		}
		findFramesAndFactor(e, t) {
			if (e.length === 0) return null;
			if (e.length === 1) return {
				from: e[0],
				to: e[0],
				factor: 0
			};
			let n = e[0], r = e[e.length - 1];
			if (t <= n.percent) {
				let r = e[1].percent - n.percent;
				return {
					from: n,
					to: e[1],
					factor: r === 0 ? 1 : (t - n.percent) / r
				};
			}
			if (t >= r.percent) {
				let n = e[e.length - 2], i = r.percent - n.percent;
				return {
					from: n,
					to: r,
					factor: i === 0 ? 1 : (t - n.percent) / i
				};
			}
			for (let n = 0; n < e.length - 1; n++) if (t >= e[n].percent && t <= e[n + 1].percent) {
				let r = e[n + 1].percent - e[n].percent;
				return {
					from: e[n],
					to: e[n + 1],
					factor: r === 0 ? 1 : (t - e[n].percent) / r
				};
			}
			return {
				from: r,
				to: r,
				factor: 0
			};
		}
		getDiscrete(e, t) {
			let n = this._keyFrames[e] || this.keyframes.filter((t) => e in t.values);
			if (n.length === 0) return null;
			let r = n[0];
			for (let e of n) if (e.percent <= t) r = e;
			else break;
			return r.values[e].value;
		}
		getDefault(e) {
			let t = e.split(":")[1];
			return t && n[t] ? n[t] : [{
				value: 0,
				unit: ""
			}];
		}
		getFrame(e) {
			let t = e * 100, n = this._allKeys, a = {};
			for (let e of n) {
				let n = this._keyFrames[e];
				if (!n || n.length === 0) continue;
				let o = n[0].values[e];
				if (o && o.discrete) {
					a[e] = this.getDiscrete(e, t);
					continue;
				}
				let { from: s, to: c, factor: l } = this.findFramesAndFactor(n, t), u = s.values[e], d = c.values[e];
				if (u && "red" in u) {
					a[e] = this.lerpColor(u, d, l);
					continue;
				}
				if (u && u.args) {
					let t = d.args || this.getDefault(e), n = this.getDefault(e), o = Math.max(u.args.length, t.length), s = [];
					for (let e = 0; e < o; e++) {
						let r = u.args[e] || n[e] || {
							value: 0,
							unit: ""
						}, i = t[e] || n[e] || {
							value: 0,
							unit: ""
						};
						s.push({
							value: this.lerp(r.value, i.value, l),
							unit: r.unit || i.unit
						});
					}
					let c = r[e.includes(":") ? e.substring(e.indexOf(":") + 1) : e];
					if (c) for (let e of s) e.value = Math.min(c[1], Math.max(c[0], e.value));
					let f = { args: s };
					(u.color || d.color) && (f.color = this.lerpColor(u.color || i, d.color || i, l)), a[e] = f;
					continue;
				}
				if (u && "value" in u) {
					let t = d || this.getDefault(e)[0], n = this.lerp(u.value, t.value, l), i = r[e];
					i && (n = Math.min(i[1], Math.max(i[0], n))), a[e] = {
						value: n,
						unit: u.unit
					};
				}
			}
			return this.toStyles(a);
		}
		toStyles(e) {
			let n = {}, r = {};
			for (let i in e) {
				let a = e[i], o = i.indexOf(":");
				if (o !== -1) {
					let e = i.substring(0, o), n = i.substring(o + 1);
					if (t.has(e)) {
						if (r[e] || (r[e] = {}), a.args) if (n.startsWith("drop-shadow-")) {
							let t = n.replace(/-\d+$/, ""), i = a.args.map((e) => `${this.format(e.value)}${e.unit}`).join(" ");
							if (a.color) {
								let o = a.color, s = o.alpha < 1 ? `rgba(${o.red},${o.green},${o.blue},${o.alpha})` : `rgb(${o.red},${o.green},${o.blue})`;
								r[e][n] = `${t}(${i} ${s})`;
							} else r[e][n] = `${t}(${i})`;
						} else r[e][n] = `${n}(${a.args.map((e) => `${this.format(e.value)}${e.unit}`).join(", ")})`;
						else r[e][n] = `${n}(${this.format(a.value)}${a.unit})`;
						continue;
					}
				}
				if (typeof a == "string" || typeof a == "number") {
					n[i] = a;
					continue;
				}
				if (a && "red" in a) {
					n[i] = a.alpha < 1 ? `rgba(${a.red},${a.green},${a.blue},${a.alpha})` : `rgb(${a.red},${a.green},${a.blue})`;
					continue;
				}
				if (a && "value" in a) {
					n[i] = `${this.format(a.value)}${a.unit}`;
					continue;
				}
				n[i] = a;
			}
			for (let e in r) {
				let t = r[e], i = (this._orders[e] || Object.keys(t)).filter((e) => t[e]).map((e) => t[e]);
				i.length > 0 && (n[e] = i.join(" "));
			}
			return n;
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
			this.#spring = new b({
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
			this.#frames = new c(this.#buildKeyframes(fromMeasure, toMeasure));
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