'use strict';

const assert = require('assert');
const sinon = require('sinon');
const crypto = require('crypto');

const testEventMaker = require('../lib/testing-helper');

describe('TestEventMaker Function', () => {

	let env;

	const dateNow = new Date();
	const sampleUuid = 'c7056eb7-e211-442a-9176-053a4eb092ee';

	before(() => {
		env = { ...process.env };
	});

	beforeEach(() => {
		sinon.stub(crypto, 'randomUUID').returns(sampleUuid);
		sinon.useFakeTimers(dateNow);
	});

	afterEach(() => {
		sinon.restore();
	});

	after(() => {
		process.env = env;
	});

	const detail = {
		id: sampleUuid,
		dateCreated: dateNow
	};

	const eventBase = {
		version: '0',
		id: '7354185a-d869-6c4a-9f88-c0e781b24509',
		account: '554433221100',
		time: dateNow,
		region: 'us-east-3',
		resources: [],
		'detail-type': 'testExecuted',
		source: 'janis.default.test',
		detail
	};

	it('Should return an event object with default values (event-id, event-name, event-dateCreated, event-source)', () => {
		assert.deepStrictEqual(testEventMaker(), eventBase);
	});

	it('Should return an event object with session and default values (event-id, event-name, event-dateCreated, event-source)', () => {

		assert.deepStrictEqual(testEventMaker({
			clientCode: 'testing'
		}), {
			...eventBase,
			detail: {
				...detail,
				session: { clientCode: 'testing' }
			}
		});
	});

	it('Should return an event object with body and default values (event-id, event-name, event-dateCreated, event-source)', () => {

		assert.deepStrictEqual(testEventMaker({
			body: { message: 'it is a test' }
		}), {
			...eventBase,
			detail: {
				...detail,
				body: { message: 'it is a test' }
			}
		});
	});

	it('Should return an event object with custom eventId and eventDateCreated and default values (event-name, event-source)', () => {

		const dateCreated = new Date('2025-06-06T10:15:00.000Z');

		assert.deepStrictEqual(testEventMaker({
			eventId: 'some-id',
			eventDateCreated: dateCreated
		}), {
			...eventBase,
			time: dateCreated,
			detail: {
				id: 'some-id',
				dateCreated
			}
		});
	});

	it('Should return an event object with custom eventName and eventSource and default values (event-id, event-dateCreated)', () => {

		assert.deepStrictEqual(testEventMaker({
			eventName: 'testFinished',
			eventSource: 'janis.packages.testing'
		}), {
			...eventBase,
			'detail-type': 'testFinished',
			source: 'janis.packages.testing',
			detail
		});
	});
});