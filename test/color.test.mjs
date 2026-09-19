import { test } from 'node:test';
import assert from 'node:assert/strict';
import FrameEngine from '@magic-spells/frame-engine';
import { normalizeColor, parseColor } from '../src/color.js';

// The exact strings Chromium's getComputedStyle returns for the Pyramid board in
// dark mode: the kanban card's `border-border/60` (a Tailwind v4 opacity modifier,
// i.e. color-mix(in oklab, …)) and the task panel's plain `border-strong` token.
const CARD_BORDER = 'oklab(0.208595 -0.00127372 -0.0127292 / 0.6)';
const PANEL_BORDER = 'rgb(28, 32, 41)';
test('normalizes the Pyramid card border (oklab from color-mix) to rgba', () => {
	// oklab L 0.2086 is #15181e, the dark --color-border token; /60 keeps its alpha
	assert.equal(normalizeColor(CARD_BORDER), 'rgba(21, 24, 30, 0.6)');
	const parsed = parseColor(CARD_BORDER);
	assert.equal(parsed.alpha, 0.6);
	assert.deepEqual([parsed.red, parsed.green, parsed.blue], [21, 24, 30]);
});

test('normalizes the modern color syntaxes a computed style can carry', () => {
	assert.equal(normalizeColor('rgb(28, 32, 41)'), 'rgba(28, 32, 41, 1)');
	assert.equal(normalizeColor('rgb(28 32 41 / 0.5)'), 'rgba(28, 32, 41, 0.5)');
	assert.equal(normalizeColor('transparent'), 'rgba(0, 0, 0, 0)');
	assert.equal(normalizeColor('#15181e'), 'rgba(21, 24, 30, 1)');
	assert.equal(normalizeColor('#15181e99'), 'rgba(21, 24, 30, 0.6)');
	assert.equal(normalizeColor('hsl(0 0% 100%)'), 'rgba(255, 255, 255, 1)');
	// every expectation below is Chromium's own answer for the same string
	assert.equal(normalizeColor('oklch(0.7 0 0)'), 'rgba(158, 158, 158, 1)');
	assert.equal(normalizeColor('lch(50 40 120)'), 'rgba(99, 128, 56, 1)');
	assert.equal(normalizeColor('oklch(0.62 0.19 259)'), 'rgba(53, 129, 246, 1)');
	assert.equal(normalizeColor('color(srgb 1 0 0 / 0.25)'), 'rgba(255, 0, 0, 0.25)');
	assert.equal(normalizeColor('lab(100 0 0)'), 'rgba(255, 255, 255, 1)');
	assert.equal(normalizeColor('color(display-p3 1 1 1)'), 'rgba(255, 255, 255, 1)');
	assert.equal(normalizeColor('oklab(0 0 0)'), 'rgba(0, 0, 0, 1)');
	// unknown syntaxes are handed back untouched for the caller to pass through
	assert.equal(normalizeColor('var(--nope)'), null);
});

test('hue units and malformed hex do not silently misread', () => {
	// getComputedStyle always emits bare degrees, but author strings can carry units
	const half = normalizeColor('oklch(0.7 0.1 180)');
	assert.equal(normalizeColor('oklch(0.7 0.1 0.5turn)'), half);
	assert.equal(normalizeColor('oklch(0.7 0.1 200grad)'), half);
	assert.equal(normalizeColor('oklch(0.7 0.1 180deg)'), half);
	// a hex of an invalid length is not a color — pass it through untouched
	assert.equal(normalizeColor('#abcde'), null);
	assert.equal(normalizeColor('#abcdefa'), null);
});

test('the normalized card/panel pair interpolates in frame-engine (no NaN)', () => {
	// The regression: the raw pair yields `rgb(NaN,NaN,NaN)`, which the CSSOM drops,
	// leaving the blob's border at its `currentColor` fallback — an opaque white line.
	const raw = new FrameEngine({ 0: { c: CARD_BORDER }, 100: { c: PANEL_BORDER } });
	assert.match(String(raw.getFrame(0.5).c), /NaN|oklab/);

	const frames = new FrameEngine({
		0: { c: normalizeColor(CARD_BORDER) },
		100: { c: normalizeColor(PANEL_BORDER) },
	});
	for (const p of [0, 0.25, 0.5, 0.75, 1]) {
		const value = frames.getFrame(p).c;
		assert.ok(typeof value === 'string', `frame ${p} dropped the color`);
		assert.doesNotMatch(value, /NaN/, `frame ${p} produced ${value}`);
		assert.match(value, /^rgba?\(/, `frame ${p} produced ${value}`);
	}
});

test('a zero-width transparent end interpolates against a tinted 1px line', () => {
	const frames = new FrameEngine({
		0: { w: '0px', c: normalizeColor('rgba(21, 24, 30, 0)') },
		100: { w: '1px', c: normalizeColor(CARD_BORDER) },
	});
	const mid = frames.getFrame(0.5);
	assert.equal(mid.w, '0.5px');
	assert.equal(mid.c, 'rgba(21,24,30,0.3)');
});
