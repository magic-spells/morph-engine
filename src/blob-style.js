/**
 * The blob's static base styles — everything that does not come from a keyframe.
 * Its own module so it can be asserted without a DOM.
 */

/**
 * @param {{borderStyle: string}} fromMeasure
 * @param {{borderStyle: string}} toMeasure
 * @param {number|string} zIndex
 * @returns {Object<string, string>} styles to assign to the blob element
 */
export function blobBaseStyle(fromMeasure, toMeasure, zIndex) {
	const borderStyle =
		toMeasure.borderStyle !== 'none'
			? toMeasure.borderStyle
			: fromMeasure.borderStyle !== 'none'
				? fromMeasure.borderStyle
				: 'solid';

	return {
		position: 'fixed',
		top: '0',
		left: '0',
		margin: '0',
		boxSizing: 'border-box',
		pointerEvents: 'none',
		overflow: 'hidden',
		display: 'block',
		zIndex: String(zIndex),
		// border-style on its own computes to `medium solid currentColor` — a 3px ring
		// in the body's ink, near-white on a dark theme. Frame 0 overwrites width and
		// color immediately, but any frame whose border longhand is missing or invalid
		// is a silent CSSOM no-op and that fallback paints instead. Starting at zero
		// width and transparent means the worst case is no border, never a white one.
		borderWidth: '0',
		borderColor: 'transparent',
		borderStyle,
		willChange: 'top, left, width, height, opacity',
	};
}
