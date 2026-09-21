import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blobBaseStyle } from '../src/blob-style.js';

test('a fresh blob paints no border before the first frame lands', () => {
	for (const pair of [
		[{ borderStyle: 'solid' }, { borderStyle: 'solid' }],
		[{ borderStyle: 'none' }, { borderStyle: 'none' }],
		[{ borderStyle: 'none' }, { borderStyle: 'dashed' }],
	]) {
		const style = blobBaseStyle(pair[0], pair[1], 9999);
		assert.equal(parseFloat(style.borderWidth), 0, 'blob must start at zero border width');
		assert.equal(style.borderColor, 'transparent', 'blob must never start at currentColor');
	}
});

test('border-style comes from the target, else the source, else solid', () => {
	assert.equal(
		blobBaseStyle({ borderStyle: 'dotted' }, { borderStyle: 'dashed' }, 1).borderStyle,
		'dashed'
	);
	assert.equal(
		blobBaseStyle({ borderStyle: 'dotted' }, { borderStyle: 'none' }, 1).borderStyle,
		'dotted'
	);
	assert.equal(
		blobBaseStyle({ borderStyle: 'none' }, { borderStyle: 'none' }, 1).borderStyle,
		'solid'
	);
});
