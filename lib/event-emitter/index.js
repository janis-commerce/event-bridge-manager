'use strict';

const EventBridgeLib = require('@aws-sdk/client-eventbridge');

const crypto = require('crypto');

const EventBridgeEmitterError = require('./event-emitter-error');

const isUndefined = require('../helpers/type-validation/is-undefined');
const isStringNotEmpty = require('../helpers/type-validation/is-string-not-empty');
const isObject = require('../helpers/type-validation/is-object');

const DEFAULT_ENV = 'local';

/**
 * Event to emit
 * @typedef {Object} EventToEmit
 * @property {string} name Event Name
 * @property {string} clientCode Client Code
 * @property {object} detail The information of the event
 * @property {string} busArn An ARN of a Custom Bus where emit the event. Default use Central-Bus ARN
 */

/**
 * @class EventEmitter
 * @classdesc A class for emit events
 */

/**
 * @typedef {Object} EventBridgeEmitterError - Error object
 */

module.exports = class EventEmitter {

	static get _serviceName() {
		return process.env.JANIS_SERVICE_NAME;
	}

	static get _env() {
		return process.env.JANIS_ENV || DEFAULT_ENV;
	}

	static get _centralBusArn() {
		return process.env.CENTRAL_BUS_ARN;
	}

	/**
	 * Emits an event to janis-events
	 * @param {EventToEmit} event event object
	 * @throws {EventBridgeEmitterError} if the operation fails
	 */
	static async emit(event) {

		if(this.isTestEnv() || this.isLocalEnv())
			return;

		// Validation
		this.validateEvent(event);

		// Format Event
		const eventEntry = this.formatEventEntry(event);

		// Send Event
		return this.sendEvent(eventEntry);
	}

	static isTestEnv() {
		return !!process.env.TEST_ENV;
	}

	static isLocalEnv() {
		return this._env === DEFAULT_ENV;
	}

	/**
	 * Validates the event properties
	 * @param {EventToEmit} event event properties
	 * @throws {EventBridgeEmitterError} if the operation fails
	 */
	static validateEvent(event) {

		if(isUndefined(this._serviceName))
			throw new EventBridgeEmitterError(this.getValidationErrorMessage('Unknown origin service name'), EventBridgeEmitterError.codes.NO_SERVICE_NAME);

		if(isUndefined(event))
			throw new EventBridgeEmitterError(this.getValidationErrorMessage('No event data'), EventBridgeEmitterError.codes.NO_EVENT_DATA);

		if(isUndefined(event.name) || !isStringNotEmpty(event.name))
			throw new EventBridgeEmitterError(this.getValidationErrorMessage('Unknown event name'), EventBridgeEmitterError.codes.NO_EVENT_NAME);

		if(isUndefined(this._centralBusArn) && isUndefined(event.busArn))
			throw new EventBridgeEmitterError(this.getValidationErrorMessage('Unknown event bus arn'), EventBridgeEmitterError.codes.NO_EVENT_BUS_ARN);

		if(event.clientCode && !isStringNotEmpty(event.clientCode))
			throw new EventBridgeEmitterError(this.getValidationErrorMessage('Unknown client-code'), EventBridgeEmitterError.codes.INVALID_CLIENT_CODE);

		if(event.detail && !isObject(event.detail))
			throw new EventBridgeEmitterError(this.getValidationErrorMessage('Unknown user id'), EventBridgeEmitterError.codes.INVALID_DETAIL);
	}

	static getValidationErrorMessage(message) {
		return `Cannot emit the event: ${message}`;
	}

	static formatEventEntry(event) {
		return {
			Source: `janis.${this._serviceName}.${this._env}`,
			DetailType: event.name,
			EventBusName: event.busArn || this._centralBusArn,
			Detail: JSON.stringify({
				...this.formatEventDetail(event),
				...this.formatSession(event),
				...event.detail ? { body: event.detail } : {}
			})
		};
	}

	static formatSession(event) {
		return event.clientCode ? {
			session: {
				clientCode: event.clientCode
			}
		} : {};
	}

	static formatEventDetail() {
		return {
			id: crypto.randomUUID(),
			dateCreated: new Date()
		};
	}

	static async sendEvent(entry) {

		const eventBridgeClient = await new EventBridgeLib.EventBridgeClient();

		try {
			await eventBridgeClient.send(
				new EventBridgeLib.PutEventsCommand({
					Entries: [entry]
				})
			);
		} catch(error) {
			throw new EventBridgeEmitterError(error, EventBridgeEmitterError.codes.EVENT_BRIDGE_CLIENT_ERROR);
		}
	}
};
