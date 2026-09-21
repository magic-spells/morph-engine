/**
 * Where the blob lives for a flight. Its own module so the resolution rules can be
 * asserted without a DOM (see test/blob-container.test.mjs).
 *
 * The blob is `position: fixed`, and a fixed element in `<body>` paints UNDER the
 * browser's top layer — so a flight whose destination is inside (or is) an open
 * `showModal()` dialog is invisible. Appending the blob into that dialog's subtree
 * puts it in the same layer as the destination; `container` is how a consumer says
 * where.
 */

/**
 * Resolves the element the blob is appended to for one flight.
 *
 * Per-call wins over the engine-level value, and either may be a function — it is
 * called once per flight, so a consumer can answer "the nearest open modal dialog
 * of the source, else body" at show time rather than at construction. A nullish
 * result (or a value that is not an element) falls back, with a warning for the
 * latter so a typo surfaces instead of silently flying under a dialog.
 *
 * @param {Element|(() => Element|null|undefined)|null|undefined} override - Per-call value
 * @param {Element|(() => Element|null|undefined)|null|undefined} base - Engine-level value
 * @param {Element} fallback - Used when neither yields an element (`document.body`)
 * @returns {Element}
 */
export function resolveBlobContainer(override, base, fallback) {
	const picked = override !== undefined ? override : base;
	const value = typeof picked === 'function' ? picked() : picked;
	if (value == null) return fallback;
	if (!isElement(value)) {
		console.warn(
			'MorphEngine: `container` must be an Element or a function returning one — falling back to document.body.'
		);
		return fallback;
	}
	return value;
}

/** Element or close enough — nodeType 1 works for real DOM and any test double. */
function isElement(value) {
	return (
		typeof value === 'object' && value.nodeType === 1 && typeof value.appendChild === 'function'
	);
}
