/* eslint-disable max-classes-per-file */

'use strict';

const assert = require('assert');
const sinon = require('sinon');

const { Lambda } = require('@janiscommerce/lambda');
const { ApiSession } = require('@janiscommerce/api-session');

const { EventHandler } = require('../lib');

const {
	utils: {
		serviceName,
		envName,
		dateNow,
		clientCode,
		sampleOrder
	},
	eventData,
	awsLambdaEvent,
	eventBridgeGeneric,
	eventBridgeComplete,
	eventBridgeWithoutBody,
	eventBridgeWithoutSession,
	eventBridgeWithoutBodyAndSession
} = require('./resources/events');

const centralBusArn = require('./resources/centra-bus-arn');

describe('EventHandler', () => {

	let env;

	before(() => {

		env = { ...process.env };

		process.env.JANIS_SERVICE_NAME = serviceName;
		process.env.JANIS_ENV = envName;
		process.env.AWS_LAMBDA_FUNCTION_NAME = 'TestLambdaFunction';
		process.env.CENTRAL_BUS_ARN = centralBusArn;
	});

	beforeEach(() => {
		sinon.useFakeTimers(dateNow);
	});

	afterEach(() => {
		sinon.restore();
	});

	after(() => {
		process.env = env;
	});

	const session = { clientCode };
	const body = { ...sampleOrder };

	context('When aws-event is not from event-bridge', () => {

		// Handler supports normal Lambda events

		it('Should set correct session and data', async () => {

			const apiSession = new ApiSession({ ...session });
			class LambdaFunctionExample extends Lambda {

				process() {
					return {
						session: this.session,
						data: this.data
					};
				}
			}

			assert.deepStrictEqual(await EventHandler.handle(LambdaFunctionExample, awsLambdaEvent), { session: apiSession, data: body });
		});

		it('Should not set eventData (because it is not an Event from Event-Bridge)', async () => {

			class LambdaFunctionExample extends Lambda {

				process() {
					return {
						eventData: this.data.eventData
					};
				}
			}

			assert.deepStrictEqual(await EventHandler.handle(LambdaFunctionExample, awsLambdaEvent), { eventData: undefined });
		});
	});

	context('When aws-event is from event-bridge generic', () => {

		// The event come from a Bus and it was emitted not using event-emitter in this package

		it('Should set eventData with source and eventName', async () => {

			class LambdaFunctionExample extends Lambda {

				process() {

					const { eventData: eventInPayload } = this.data;

					return {
						name: eventInPayload.name,
						source: eventInPayload.source
					};
				}
			}

			assert.deepStrictEqual(await EventHandler.handle(LambdaFunctionExample, eventBridgeGeneric), {
				name: eventBridgeGeneric['detail-type'],
				source: eventBridgeGeneric.source
			});
		});

		it('Should set eventData with source and eventName and body with detail info', async () => {

			class LambdaFunctionExample extends Lambda {

				process() {

					const { eventData: eventInPayload, ...bodyInPayload } = this.data;

					return {
						name: eventInPayload.name,
						source: eventInPayload.source,
						body: bodyInPayload
					};
				}
			}

			assert.deepStrictEqual(await EventHandler.handle(LambdaFunctionExample, {
				...eventBridgeGeneric,
				detail: {
					message: 'Testing'
				}
			}), {
				name: eventBridgeGeneric['detail-type'],
				source: eventBridgeGeneric.source,
				body: {
					message: 'Testing'
				}
			});
		});
	});

	context('When aws-event is from event-bridge used for global events', () => {

		// The event come from the Central Bus and it was emitted using event-emitter in this package
		// The event has not client, probably to be used for every client

		it('Should set eventData with every property set in the event-emitter and a body', async () => {

			class LambdaFunctionExample extends Lambda {

				process() {

					const { eventData: eventInPayload, ...bodyInPayload } = this.data;

					return {
						eventData: eventInPayload,
						body: bodyInPayload
					};
				}
			}

			assert.deepStrictEqual(await EventHandler.handle(LambdaFunctionExample, eventBridgeWithoutSession), {
				eventData,
				body: {
					message: 'Janis will be closed until next Sunday'
				}
			});
		});

		it('Should set eventData with every property set in the event-emitter and no body', async () => {

			class LambdaFunctionExample extends Lambda {

				process() {

					const { eventData: eventInPayload, ...bodyInPayload } = this.data;

					return {
						eventData: eventInPayload,
						body: bodyInPayload
					};
				}
			}

			assert.deepStrictEqual(await EventHandler.handle(LambdaFunctionExample, eventBridgeWithoutBodyAndSession), {
				eventData,
				body: {}
			});
		});
	});

	context('When aws-event is from event-bridge used for clients events', () => {

		// The event come from the Central Bus and it was emitted using event-emitter in this package
		// The event has client

		it('Should set eventData with every property set in the event-emitter, session and no body', async () => {

			const apiSession = new ApiSession({ ...session });
			class LambdaFunctionExample extends Lambda {

				process() {

					const { eventData: eventInPayload, ...bodyInPayload } = this.data;

					return {
						eventData: eventInPayload,
						body: bodyInPayload,
						session: this.session
					};
				}
			}

			assert.deepStrictEqual(await EventHandler.handle(LambdaFunctionExample, eventBridgeWithoutBody), {
				eventData,
				body: {},
				session: apiSession
			});
		});

		it('Should set eventData with every property set in the event-emitter, session and body', async () => {

			const apiSession = new ApiSession({ ...session });
			class LambdaFunctionExample extends Lambda {

				process() {

					const { eventData: eventInPayload, ...bodyInPayload } = this.data;

					return {
						eventData: eventInPayload,
						body: bodyInPayload,
						session: this.session
					};
				}
			}

			assert.deepStrictEqual(await EventHandler.handle(LambdaFunctionExample, eventBridgeComplete), {
				eventData,
				body,
				session: apiSession
			});
		});
	});
});
