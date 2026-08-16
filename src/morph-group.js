import EventEmitter from './event-emitter.js';
import { MorphEngine } from './morph-engine.js';

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
export class MorphGroup extends EventEmitter {
	#options;
	#engines = [];
	#pendingLaunches = new Map();
	#aggregateCancels = new Set();
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
		if (this.#engines.every((engine) => engine.state === 'idle')) return 'idle';
		if (this.#engines.some((engine) => engine.state === 'showing')) return 'showing';
		if (this.#engines.some((engine) => engine.state === 'hiding')) return 'hiding';
		return 'shown';
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
		const cancelShown = this.#watchAggregate(engines, 'shown', operation);
		const cancelComplete = oneWay
			? this.#watchAggregate(engines, 'complete', operation)
			: () => {};
		const last = pairs.length - 1;
		const promises = pairs.map((pair, index) => {
			const engine = engines[index];
			const pairDisplay = pair.display !== undefined ? pair.display : display;
			return this.#schedule(staggerDelay(stagger, index, last), () =>
				engine.show({
					...overrides,
					from: pair.from,
					to: pair.to,
					display: pairDisplay,
					oneWay,
				})
			);
		});

		try {
			const results = await Promise.all(promises);
			return results.every(Boolean);
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
		const engines = this.#engines.filter((engine) => engine.state !== 'idle');
		const cancelHidden = this.#watchAggregate(engines, 'hidden', operation);
		const last = engines.length - 1;
		try {
			const results = await Promise.all(
				engines.map((engine, index) =>
					this.#schedule(staggerDelay(stagger, index, last), () =>
						// a stop()/complete() may have landed during the stagger window
						engine.state === 'idle' ? false : engine.hide(overrides)
					)
				)
			);
			return results.every(Boolean);
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
		const engines = this.#engines.filter((engine) => engine.state !== 'idle');
		const cancelComplete = this.#watchAggregate(engines, 'complete', operation);
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
		while (this.#engines.length <= index) {
			this.#engines.push(new MorphEngine(this.#options));
		}
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
		const listeners = new Map();
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
}
