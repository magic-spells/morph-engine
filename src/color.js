/**
 * Color normalization for captured computed styles.
 *
 * Computed border/background colors are NOT always legacy `rgb()`. A Tailwind v4
 * opacity modifier (`border-border/60`) emits
 * `color-mix(in oklab, var(--color-border) 60%, transparent)`, which Chrome computes —
 * and getComputedStyle serializes — as `oklab(L a b / alpha)`. frame-engine only
 * recognizes hex / rgb() / hsl() / color(srgb …); handed an `oklab()` string it treats
 * the value as non-interpolable, and a keyframe pair that mixes one of those with a
 * legacy `rgb()` yields `rgb(NaN,NaN,NaN)` — an invalid value the CSSOM silently drops,
 * so the blob's border falls back to `currentColor` and paints an opaque line
 * (white-on-dark). Normalizing every captured color to `rgba()` up front keeps the
 * whole pipeline in one syntax frame-engine can actually lerp.
 */

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);

/** Strips the function name and splits `a b c / d` (or the legacy comma form) into tokens. */
function functionArguments(value, name) {
	const match = value.match(new RegExp(`^${name}\\(\\s*(.+?)\\s*\\)$`, 'i'));
	if (!match) return null;
	const [main, alphaPart] = match[1].split('/');
	const parts = main
		.trim()
		.split(/[\s,]+/)
		.filter(Boolean);
	if (alphaPart !== undefined) parts.push(alphaPart.trim());
	return parts;
}

/** A number or percentage token; percentages resolve against `scale`. */
function numberToken(token, scale = 1) {
	if (token === undefined || token === 'none') return 0;
	const value = parseFloat(token);
	if (Number.isNaN(value)) return 0;
	return token.trim().endsWith('%') ? (value / 100) * scale : value;
}

function alphaToken(token) {
	if (token === undefined || token === 'none') return 1;
	const value = parseFloat(token);
	if (Number.isNaN(value)) return 1;
	return clamp01(token.trim().endsWith('%') ? value / 100 : value);
}

/** Linear-light sRGB channel → gamma-encoded 0–255. */
function encodeChannel(linear) {
	const encoded =
		linear <= 0.0031308
			? 12.92 * linear
			: 1.055 * Math.sign(linear) * Math.abs(linear) ** (1 / 2.4) - 0.055;
	return Math.round(clamp01(encoded) * 255);
}

/** Oklab → linear sRGB (Björn Ottosson's matrices). */
function oklabToLinearSrgb(L, a, b) {
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
	];
}

/** CIE Lab (D50) → linear sRGB. */
function labToLinearSrgb(L, a, b) {
	const fy = (L + 16) / 116;
	const fx = fy + a / 500;
	const fz = fy - b / 200;
	const EPSILON = 216 / 24389;
	const KAPPA = 24389 / 27;
	const cube = (t) => (t ** 3 > EPSILON ? t ** 3 : (116 * t - 16) / KAPPA);
	// D50 white point
	const x = cube(fx) * (0.3457 / 0.3585);
	const y = L > KAPPA * EPSILON ? fy ** 3 : L / KAPPA;
	const z = cube(fz) * ((1 - 0.3457 - 0.3585) / 0.3585);
	// XYZ(D50) → linear sRGB (Bradford-adapted)
	return [
		3.1341359569 * x - 1.6173352505 * y - 0.4906619883 * z,
		-0.978795301 * x + 1.9161624668 * y + 0.0334415019 * z,
		0.0719452637 * x - 0.2289909604 * y + 1.4052744046 * z,
	];
}

function hslToRgb(h, s, l) {
	const hue = ((h % 360) + 360) % 360;
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
	const m = l - c / 2;
	const [r, g, b] =
		hue < 60
			? [c, x, 0]
			: hue < 120
				? [x, c, 0]
				: hue < 180
					? [0, c, x]
					: hue < 240
						? [0, x, c]
						: hue < 300
							? [x, 0, c]
							: [c, 0, x];
	return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

// display-p3 (linear-light) → linear sRGB.
const P3_TO_SRGB = [
	[1.2249401762, -0.2249401762, 0],
	[-0.0420569547, 1.0420569547, 0],
	[-0.0196375546, -0.0786360454, 1.0982736],
];

/** Gamma-encoded sRGB/P3 channel → linear light. */
function decodeChannel(value) {
	const abs = Math.abs(value);
	return abs <= 0.04045 ? value / 12.92 : Math.sign(value) * ((abs + 0.055) / 1.055) ** 2.4;
}

/**
 * Normalizes any computed color string to `rgba(r, g, b, a)`.
 * Unrecognized syntaxes return null so the caller can pass the original through.
 * @param {string} value
 * @returns {string|null}
 */
export function normalizeColor(value) {
	if (typeof value !== 'string') return null;
	const input = value.trim();
	if (!input) return null;
	if (input === 'transparent') return 'rgba(0, 0, 0, 0)';

	// legacy / modern rgb() — already interpolable, but normalize the modern
	// slash form so frame-engine's comma-only regex matches
	const rgbParts = functionArguments(input, 'rgba?');
	if (rgbParts) {
		const [r, g, b, a] = rgbParts;
		return format(numberToken(r, 255), numberToken(g, 255), numberToken(b, 255), alphaToken(a));
	}

	const hexMatch = input.match(/^#([0-9a-f]{3,8})$/i);
	if (hexMatch) {
		const hex = hexMatch[1];
		const wide = hex.length > 4;
		const size = wide ? 2 : 1;
		const channel = (index) => {
			const slice = hex.substr(index * size, size);
			return parseInt(wide ? slice : slice + slice, 16);
		};
		const alpha = hex.length === 4 || hex.length === 8 ? channel(3) / 255 : 1;
		return format(channel(0), channel(1), channel(2), alpha);
	}

	const hslParts = functionArguments(input, 'hsla?');
	if (hslParts) {
		const [h, s, l, a] = hslParts;
		const [r, g, b] = hslToRgb(
			parseFloat(h) || 0,
			(parseFloat(s) || 0) / 100,
			(parseFloat(l) || 0) / 100
		);
		return format(r, g, b, alphaToken(a));
	}

	const oklabParts = functionArguments(input, 'oklab');
	if (oklabParts) {
		const [L, a, b, alpha] = oklabParts;
		return fromLinear(
			oklabToLinearSrgb(numberToken(L, 1), numberToken(a, 0.4), numberToken(b, 0.4)),
			alphaToken(alpha)
		);
	}

	const oklchParts = functionArguments(input, 'oklch');
	if (oklchParts) {
		const [L, C, H, alpha] = oklchParts;
		const hue = (numberToken(H) * Math.PI) / 180;
		const chroma = numberToken(C, 0.4);
		return fromLinear(
			oklabToLinearSrgb(numberToken(L, 1), chroma * Math.cos(hue), chroma * Math.sin(hue)),
			alphaToken(alpha)
		);
	}

	const labParts = functionArguments(input, 'lab');
	if (labParts) {
		const [L, a, b, alpha] = labParts;
		return fromLinear(
			labToLinearSrgb(numberToken(L, 100), numberToken(a, 125), numberToken(b, 125)),
			alphaToken(alpha)
		);
	}

	const lchParts = functionArguments(input, 'lch');
	if (lchParts) {
		const [L, C, H, alpha] = lchParts;
		const hue = (numberToken(H) * Math.PI) / 180;
		const chroma = numberToken(C, 150);
		return fromLinear(
			labToLinearSrgb(numberToken(L, 100), chroma * Math.cos(hue), chroma * Math.sin(hue)),
			alphaToken(alpha)
		);
	}

	const colorParts = functionArguments(input, 'color');
	if (colorParts) {
		const [space, r, g, b, alpha] = colorParts;
		const key = String(space).toLowerCase();
		const channels = [numberToken(r, 1), numberToken(g, 1), numberToken(b, 1)];
		if (key === 'srgb') {
			return format(channels[0] * 255, channels[1] * 255, channels[2] * 255, alphaToken(alpha));
		}
		if (key === 'srgb-linear') {
			return fromLinear(channels, alphaToken(alpha));
		}
		if (key === 'display-p3') {
			const linearP3 = channels.map(decodeChannel);
			return fromLinear(
				P3_TO_SRGB.map((row) => row[0] * linearP3[0] + row[1] * linearP3[1] + row[2] * linearP3[2]),
				alphaToken(alpha)
			);
		}
	}

	return null;
}

function fromLinear(linear, alpha) {
	return `rgba(${encodeChannel(linear[0])}, ${encodeChannel(linear[1])}, ${encodeChannel(linear[2])}, ${round4(alpha)})`;
}

function format(red, green, blue, alpha) {
	const channel = (value) => Math.round(Math.min(255, Math.max(0, value)));
	return `rgba(${channel(red)}, ${channel(green)}, ${channel(blue)}, ${round4(alpha)})`;
}

function round4(value) {
	return Math.round(value * 10000) / 10000;
}

/**
 * Parses a color string into channels, normalizing modern syntaxes first.
 * @param {string} colorString
 * @returns {{red: number, green: number, blue: number, alpha: number}}
 */
export function parseColor(colorString) {
	const normalized = normalizeColor(colorString) ?? colorString;
	const match = String(normalized).match(/rgba?\(([^)]*)\)/);
	if (!match) return { red: 0, green: 0, blue: 0, alpha: 1 };
	const parts = match[1].split(',').map((part) => parseFloat(part));
	return {
		red: parts[0] || 0,
		green: parts[1] || 0,
		blue: parts[2] || 0,
		alpha: parts.length > 3 ? parts[3] : 1,
	};
}
