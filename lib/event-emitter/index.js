'use strict';

const EventBridgeLib = require('@aws-sdk/client-eventbridge');

const crypto = require('crypto');

const EventEmitterError = require('./event-emitter-error');

const isUndefined = require('../helpers/type-validation/is-undefined');
const isStringNotEmpty = require('../helpers/type-validation/is-string-not-empty');
const isObject = require('../helpers/type-validation/is-object');

const DEFAULT_ENV = 'local';

/**
 * @class EventEmitter
 * @classdesc A package for emit events
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
	 * @param {Object} event event object
	 * @returns {Object} a MS Call response object with the following keys: headers, statusCode, statusMessage, body
	 * @throws if the operation fails
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
	 * @param {Object} event event properties
	 * @throws if any of the validations fails
	 */
	static validateEvent(event) {

		if(isUndefined(this._serviceName))
			throw new EventEmitterError(this.getValidationErrorMessage('Unknown origin service name'), EventEmitterError.codes.NO_SERVICE_NAME);

		if(isUndefined(event))
			throw new EventEmitterError(this.getValidationErrorMessage('No event data'), EventEmitterError.codes.NO_EVENT_DATA);

		if(isUndefined(event.name) || !isStringNotEmpty(event.name))
			throw new EventEmitterError(this.getValidationErrorMessage('Unknown event name'), EventEmitterError.codes.NO_EVENT_NAME);

		if(isUndefined(this._centralBusArn) && isUndefined(event.busArn))
			throw new EventEmitterError(this.getValidationErrorMessage('Unknown event bus arn'), EventEmitterError.codes.NO_EVENT_BUS_ARN);

		if(event.clientCode && !isStringNotEmpty(event.clientCode))
			throw new EventEmitterError(this.getValidationErrorMessage('Unknown client-code'), EventEmitterError.codes.INVALID_CLIENT_CODE);

		if(event.detail && !isObject(event.detail))
			throw new EventEmitterError(this.getValidationErrorMessage('Unknown user id'), EventEmitterError.codes.INVALID_DETAIL);
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
			throw new EventEmitterError(error, EventEmitterError.codes.EVENT_BRIDGE_CLIENT_ERROR);
		}
	}
};
