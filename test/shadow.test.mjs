import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseShadow, lerpShadow } from '../src/shadow.js';

// Chromium's computed box-shadow for the Pyramid kanban card's `shadow-card`:
// four placeholder rings, an inset top lip, then the two real shadows.
const CARD_SHADOW =
	'rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, ' +
	'rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, ' +
	'rgba(255, 255, 255, 0.04) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.4) 0px 1px 2px 0px, ' +
	'rgba(0, 0, 0, 0.5) 0px 18px 40px -20px';

test('a Tailwind shadow list contributes its first VISIBLE outer shadow', () => {
	const shadow = parseShadow(CARD_SHADOW);
	assert.deepEqual(
		{
			x: shadow.x,
			y: shadow.y,
			blur: shadow.blur,
			spread: shadow.spread,
			alpha: shadow.color.alpha,
		},
		{ x: 0, y: 1, blur: 2, spread: 0, alpha: 0.4 }
	);
});

test('a plain single shadow still parses, in either serialization order', () => {
	const a = parseShadow('rgba(0, 0, 0, 0.25) 0px 25px 50px -12px');
	const b = parseShadow('0px 25px 50px -12px rgba(0, 0, 0, 0.25)');
	assert.deepEqual([a.x, a.y, a.blur, a.spread], [0, 25, 50, -12]);
	assert.deepEqual([b.x, b.y, b.blur, b.spread], [0, 25, 50, -12]);
});

test('an oklab shadow color parses instead of collapsing to black', () => {
	const shadow = parseShadow('oklab(0.208595 -0.00127372 -0.0127292 / 0.6) 0px 2px 4px 0px');
	assert.deepEqual(
		[shadow.color.red, shadow.color.green, shadow.color.blue, shadow.color.alpha],
		[21, 24, 30, 0.6]
	);
});

test('none / missing ends stay valid CSS and clamp alpha through overshoot', () => {
	assert.equal(parseShadow('none'), null);
	assert.equal(lerpShadow(null, null, 0.5), 'none');
	const value = lerpShadow(parseShadow(CARD_SHADOW), null, 1.3);
	assert.match(value, /^-?[\d.]+px -?[\d.]+px [\d.]+px -?[\d.]+px rgba\(\d+, \d+, \d+, [\d.]+\)$/);
	const alpha = parseFloat(value.match(/([\d.]+)\)$/)[1]);
	assert.ok(alpha >= 0 && alpha <= 1, `alpha ${alpha} out of range`);
});
