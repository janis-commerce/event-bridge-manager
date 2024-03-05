'use strict';

const assert = require('assert');
const sinon = require('sinon');

const { EventBridgeClient } = require('@aws-sdk/client-eventbridge');
const crypto = require('crypto');

const { EventEmitter } = require('../lib');
const EventEmitterError = require('../lib/event-emitter/event-emitter-error');

describe('EventEmitter', () => {

	let env;
	const dateNow = new Date();

	before(() => {
		env = { ...process.env };
	});

	beforeEach(() => {
		sinon.useFakeTimers(dateNow);
	});

	afterEach(() => {

		sinon.restore();

		delete process.env.CENTRAL_BUS_ARN;
		delete process.env.JANIS_SERVICE_NAME;
		delete process.env.JANIS_ENV;
	});

	after(() => {
		process.env = env;
	});

	const centralBusArn = 'arn:aws:events:default:000000000000:event-bus/Janis-CentralBus-Service';
	const serviceName = 'JCN';
	const envName = 'testing';
	const eventName = 'testExecuted';
	const sampleUuid = 'c7056eb7-e211-442a-9176-053a4eb092ee';
	const clientCode = 'defaultClient';

	context('When it must not executed', () => {

		it('Should not emit event if Env is "local"', async () => {

			sinon.stub(EventBridgeClient.prototype, 'send');

			await EventEmitter.emit({
				name: eventName
			});

			sinon.assert.notCalled(EventBridgeClient.prototype.send);
		});

		it('Should not emit event if Test Var is config', async () => {

			process.env.TEST_ENV = 'true';

			sinon.stub(EventBridgeClient.prototype, 'send');

			await EventEmitter.emit({
				name: eventName
			});

			sinon.assert.notCalled(EventBridgeClient.prototype.send);

			delete process.env.TEST_ENV;
		});
	});

	context('When event is invalid', () => {

		it('Should throw error if Service Name is not config', async () => {

			process.env.JANIS_ENV = envName;

			sinon.stub(EventBridgeClient.prototype, 'send');

			await assert.rejects(EventEmitter.emit({
				name: eventName
			}), { code: EventEmitterError.codes.NO_SERVICE_NAME });

			sinon.assert.notCalled(EventBridgeClient.prototype.send);
		});

		it('Should throw error if Event data is not sent', async () => {

			process.env.JANIS_SERVICE_NAME = serviceName;
			process.env.JANIS_ENV = envName;

			sinon.stub(EventBridgeClient.prototype, 'send');

			await assert.rejects(EventEmitter.emit(), { code: EventEmitterError.codes.NO_EVENT_DATA });

			sinon.assert.notCalled(EventBridgeClient.prototype.send);
		});

		it('Should throw error if Event Name is not sent', async () => {

			process.env.JANIS_SERVICE_NAME = serviceName;
			process.env.JANIS_ENV = envName;

			sinon.stub(EventBridgeClient.prototype, 'send');

			await assert.rejects(EventEmitter.emit({ clientCode }), { code: EventEmitterError.codes.NO_EVENT_NAME });

			sinon.assert.notCalled(EventBridgeClient.prototype.send);
		});

		it('Should throw error if Event Name is invalid', async () => {

			process.env.JANIS_SERVICE_NAME = serviceName;
			process.env.JANIS_ENV = envName;

			sinon.stub(EventBridgeClient.prototype, 'send');

			await assert.rejects(EventEmitter.emit({
				name: '',
				clientCode
			}), { code: EventEmitterError.codes.NO_EVENT_NAME });

			sinon.assert.notCalled(EventBridgeClient.prototype.send);
		});

		it('Should throw error if Event Bus is not sent or config', async () => {

			process.env.JANIS_SERVICE_NAME = serviceName;
			process.env.JANIS_ENV = envName;

			sinon.stub(EventBridgeClient.prototype, 'send');

			await assert.rejects(EventEmitter.emit({
				name: eventName
			}), { code: EventEmitterError.codes.NO_EVENT_BUS_ARN });

			sinon.assert.notCalled(EventBridgeClient.prototype.send);
		});

		it('Should throw error if Event client-code is invalid', async () => {

			process.env.JANIS_SERVICE_NAME = serviceName;
			process.env.JANIS_ENV = envName;
			process.env.CENTRAL_BUS_ARN = centralBusArn;

			sinon.stub(EventBridgeClient.prototype, 'send');

			await assert.rejects(EventEmitter.emit({
				name: eventName,
				clientCode: 1
			}), { code: EventEmitterError.codes.INVALID_CLIENT_CODE });

			sinon.assert.notCalled(EventBridgeClient.prototype.send);
		});

		it('Should throw error if Event detail is invalid', async () => {

			process.env.JANIS_SERVICE_NAME = serviceName;
			process.env.JANIS_ENV = envName;
			process.env.CENTRAL_BUS_ARN = centralBusArn;

			sinon.stub(EventBridgeClient.prototype, 'send');

			await assert.rejects(EventEmitter.emit({
				name: eventName,
				detail: 1
			}), { code: EventEmitterError.codes.INVALID_DETAIL });

			sinon.assert.notCalled(EventBridgeClient.prototype.send);
		});

	});

	context('When event is valid and use Central Bus', () => {

		beforeEach(() => {
			process.env.CENTRAL_BUS_ARN = centralBusArn;
			process.env.JANIS_SERVICE_NAME = serviceName;
			process.env.JANIS_ENV = envName;
		});

		it('Should put event in Event Bridge without details', async () => {

			sinon.stub(EventBridgeClient.prototype, 'send');
			sinon.stub(crypto, 'randomUUID').returns(sampleUuid);
			sinon.spy(EventEmitter, 'sendEvent');

			await EventEmitter.emit({
				name: eventName
			});

			sinon.assert.calledOnce(EventBridgeClient.prototype.send);
			sinon.assert.calledOnceWithExactly(EventEmitter.sendEvent, {
				Source: `janis.${serviceName}.${envName}`,
				DetailType: eventName,
				EventBusName: centralBusArn,
				Detail: JSON.stringify({
					id: sampleUuid,
					dateCreated: dateNow
				})
			});
		});

		it('Should put event in Event Bridge with clientCode', async () => {

			sinon.stub(EventBridgeClient.prototype, 'send');
			sinon.stub(crypto, 'randomUUID').returns(sampleUuid);
			sinon.spy(EventEmitter, 'sendEvent');

			await EventEmitter.emit({
				name: eventName,
				clientCode
			});

			sinon.assert.calledOnce(EventBridgeClient.prototype.send);
			sinon.assert.calledOnceWithExactly(EventEmitter.sendEvent, {
				Source: `janis.${serviceName}.${envName}`,
				DetailType: eventName,
				EventBusName: centralBusArn,
				Detail: JSON.stringify({
					id: sampleUuid,
					dateCreated: dateNow,
					session: { clientCode }
				})
			});
		});

		it('Should put event in Event Bridge with details', async () => {

			sinon.stub(EventBridgeClient.prototype, 'send');
			sinon.stub(crypto, 'randomUUID').returns(sampleUuid);
			sinon.spy(EventEmitter, 'sendEvent');

			const detail = {
				id: 'd555345345345aa67a342a',
				name: 'ar-store',
				status: 'active'
			};

			await EventEmitter.emit({
				name: eventName,
				detail
			});

			sinon.assert.calledOnce(EventBridgeClient.prototype.send);
			sinon.assert.calledOnceWithExactly(EventEmitter.sendEvent, {
				Source: `janis.${serviceName}.${envName}`,
				DetailType: eventName,
				EventBusName: centralBusArn,
				Detail: JSON.stringify({
					id: sampleUuid,
					dateCreated: dateNow,
					body: detail
				})
			});
		});

		it('Should put event in Event Bridge with clientCode and detail', async () => {

			sinon.stub(EventBridgeClient.prototype, 'send');
			sinon.stub(crypto, 'randomUUID').returns(sampleUuid);
			sinon.spy(EventEmitter, 'sendEvent');

			const detail = {
				id: 'd555345345345aa67a342a',
				name: 'ar-store',
				status: 'active'
			};

			await EventEmitter.emit({
				name: eventName,
				clientCode,
				detail
			});

			sinon.assert.calledOnce(EventBridgeClient.prototype.send);
			sinon.assert.calledOnceWithExactly(EventEmitter.sendEvent, {
				Source: `janis.${serviceName}.${envName}`,
				DetailType: eventName,
				EventBusName: centralBusArn,
				Detail: JSON.stringify({
					id: sampleUuid,
					dateCreated: dateNow,
					session: { clientCode },
					body: detail
				})
			});
		});

		it('Should put event in Event Bridge with custom bus', async () => {

			sinon.stub(EventBridgeClient.prototype, 'send');
			sinon.stub(crypto, 'randomUUID').returns(sampleUuid);
			sinon.spy(EventEmitter, 'sendEvent');

			const customBusArn = 'arn:aws:events:default:000000000000:event-bus/Janis-Custom-Service';

			await EventEmitter.emit({
				name: eventName,
				busArn: customBusArn
			});

			sinon.assert.calledOnce(EventBridgeClient.prototype.send);
			sinon.assert.calledOnceWithExactly(EventEmitter.sendEvent, {
				Source: `janis.${serviceName}.${envName}`,
				DetailType: eventName,
				EventBusName: customBusArn,
				Detail: JSON.stringify({
					id: sampleUuid,
					dateCreated: dateNow
				})
			});
		});

		it('Should throw error if AWS failed', async () => {

			sinon.stub(EventBridgeClient.prototype, 'send').rejects();
			sinon.stub(crypto, 'randomUUID').returns(sampleUuid);
			sinon.spy(EventEmitter, 'sendEvent');

			await assert.rejects(EventEmitter.emit({
				name: eventName
			}), { code: EventEmitterError.codes.EVENT_BRIDGE_CLIENT_ERROR });

			sinon.assert.calledOnce(EventBridgeClient.prototype.send);
			sinon.assert.calledOnceWithExactly(EventEmitter.sendEvent, {
				Source: `janis.${serviceName}.${envName}`,
				DetailType: eventName,
				EventBusName: centralBusArn,
				Detail: JSON.stringify({
					id: sampleUuid,
					dateCreated: dateNow
				})
			});
		});
	});
});
