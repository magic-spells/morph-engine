/**
 * Box-shadow capture and interpolation.
 *
 * frame-engine snaps multi-value shorthands discretely, so the blob's box-shadow is
 * lerped here by hand from one parsed shadow per end.
 */

import { parseColor } from './color.js';

const COLOR_PATTERN = /(?:rgba?|hsla?|oklab|oklch|lab|lch|color)\([^)]*\)|#[0-9a-fA-F]{3,8}/;

/** Splits a comma-separated CSS list on top-level commas only. */
export function splitList(value) {
	const parts = [];
	let depth = 0;
	let start = 0;
	for (let i = 0; i < value.length; i++) {
		const character = value[i];
		if (character === '(') depth++;
		else if (character === ')') depth--;
		else if (character === ',' && depth === 0) {
			parts.push(value.slice(start, i));
			start = i + 1;
		}
	}
	parts.push(value.slice(start));
	return parts.map((part) => part.trim()).filter(Boolean);
}

/** One shadow of a box-shadow list → its parts, plus whether it is an inset. */
function parseOneShadow(shadow) {
	const colorMatch = shadow.match(COLOR_PATTERN);
	const color = parseColor(colorMatch ? colorMatch[0] : 'rgba(0, 0, 0, 1)');
	const lengths = shadow
		.replace(COLOR_PATTERN, '')
		.trim()
		.split(/\s+/)
		.filter((token) => token !== 'inset' && token !== '')
		.map(parseFloat);
	const [x = 0, y = 0, blur = 0, spread = 0] = lengths;
	return { x, y, blur, spread, color, inset: /(^|\s)inset(\s|$)/.test(shadow) };
}

/**
 * Parses a computed box-shadow into the one shadow that reads as the element's
 * lift. A Tailwind shadow utility serializes a LIST whose leading entries are
 * placeholder `rgba(0, 0, 0, 0)` rings and an inset top lip, so "the first
 * shadow" is usually invisible — take the first visible outer shadow instead,
 * falling back to the first outer one, then to the first entry.
 * Handles both serialization orders (color-first and color-last).
 * @param {string} computedShadow - Value from getComputedStyle().boxShadow
 * @returns {{x: number, y: number, blur: number, spread: number, color: Object}|null}
 */
export function parseShadow(computedShadow) {
	if (!computedShadow || computedShadow === 'none') return null;

	const shadows = splitList(computedShadow).map(parseOneShadow);
	if (shadows.length === 0) return null;
	const outer = shadows.filter((shadow) => !shadow.inset);
	return outer.find((shadow) => shadow.color.alpha > 0) || outer[0] || shadows[0];
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
export function lerpShadow(fromShadow, toShadow, p) {
	if (!fromShadow && !toShadow) return 'none';

	const zeroed = (other) => ({
		x: 0,
		y: 0,
		blur: 0,
		spread: 0,
		color: { ...other.color, alpha: 0 },
	});
	const start = fromShadow || zeroed(toShadow);
	const end = toShadow || zeroed(fromShadow);
	const lerp = (a, b) => a + (b - a) * p;

	const x = round(lerp(start.x, end.x));
	const y = round(lerp(start.y, end.y));
	const blur = round(Math.max(0, lerp(start.blur, end.blur)));
	const spread = round(lerp(start.spread, end.spread));
	const red = Math.round(clamp(lerp(start.color.red, end.color.red), 0, 255));
	const green = Math.round(clamp(lerp(start.color.green, end.color.green), 0, 255));
	const blue = Math.round(clamp(lerp(start.color.blue, end.color.blue), 0, 255));
	const alpha = round(clamp(lerp(start.color.alpha, end.color.alpha), 0, 1));

	return `${x}px ${y}px ${blur}px ${spread}px rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function round(value) {
	return Math.round(value * 100) / 100;
}
