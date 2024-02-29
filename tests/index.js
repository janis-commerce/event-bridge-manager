'use strict';

const assert = require('assert');
const index = require('../lib');

describe('Index', () => {

	let env;

	beforeEach(() => {
		env = { ...process.env };
	});

	afterEach(() => {
		process.env = env;
	});

	describe('Index File', () => {

		it('Should return empty object', async () => {
			assert.deepStrictEqual(index, {});
		});
	});
});
