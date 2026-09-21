import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveBlobContainer } from '../src/blob-container.js';

// The engine appends the blob to whatever this resolves to (see #morph → #createBlob),
// so the resolution rules are the contract: these doubles are what a DOM element
// looks like to it — nodeType 1 and an appendChild.
function element(name) {
	return { name, nodeType: 1, appendChild() {} };
}

const body = element('body');

test('defaults to body when nothing is configured', () => {
	assert.equal(resolveBlobContainer(undefined, null, body), body);
	assert.equal(resolveBlobContainer(undefined, undefined, body), body);
});

test('an engine-level container element is used as given', () => {
	const dialog = element('dialog');
	assert.equal(resolveBlobContainer(undefined, dialog, body), dialog);
});

test('the function form is evaluated on every flight', () => {
	const first = element('dialog-1');
	const second = element('dialog-2');
	const answers = [first, second];
	let calls = 0;
	const container = () => answers[calls++];

	assert.equal(resolveBlobContainer(undefined, container, body), first);
	assert.equal(resolveBlobContainer(undefined, container, body), second);
	assert.equal(calls, 2, 'the resolver runs once per flight, never cached');
});

test('a function that returns nothing falls back to body', () => {
	assert.equal(
		resolveBlobContainer(undefined, () => null, body),
		body
	);
	assert.equal(
		resolveBlobContainer(undefined, () => undefined, body),
		body
	);
});

test('a per-call container wins over the engine-level one', () => {
	const engineLevel = element('engine-level');
	const perCall = element('per-call');
	assert.equal(resolveBlobContainer(perCall, engineLevel, body), perCall);
	assert.equal(
		resolveBlobContainer(() => perCall, engineLevel, body),
		perCall,
		'per-call may be a function too'
	);
	// an explicit per-call null opts out of the engine-level container for one flight
	assert.equal(resolveBlobContainer(null, engineLevel, body), body);
});

test('a non-element value warns and falls back to body', () => {
	const original = console.warn;
	const warnings = [];
	console.warn = (message) => warnings.push(message);
	try {
		assert.equal(resolveBlobContainer(undefined, 'dialog', body), body);
		assert.equal(resolveBlobContainer(undefined, { nodeType: 3 }, body), body);
	} finally {
		console.warn = original;
	}
	assert.equal(warnings.length, 2);
	assert.match(warnings[0], /container/);
});
