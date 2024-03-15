'use strict';

/**
 * @typedef CodesError
 * @property {Number} NO_SERVICE_NAME
 * @property {Number} NO_EVENT_BUS_ARN
 * @property {Number} NO_EVENT_DATA
 * @property {Number} NO_EVENT_NAME
 * @property {Number} INVALID_CLIENT_CODE
 * @property {Number} INVALID_DETAIL
 * @property {Number} EVENT_BRIDGE_CLIENT_ERROR
 */

/**
 * @class EventBridgeEmitterError
 * @extends Error
 * @classdesc It is used for error handling of the EventEmitter class
 */
module.exports = class EventBridgeEmitterError extends Error {

	/**
	 * Get the error codes
	 * @returns {CodesError}
	 */
	static get codes() {

		return {
			NO_SERVICE_NAME: 1,
			NO_EVENT_BUS_ARN: 2,
			NO_EVENT_DATA: 3,
			NO_EVENT_NAME: 4,
			INVALID_CLIENT_CODE: 5,
			INVALID_DETAIL: 6,
			EVENT_BRIDGE_CLIENT_ERROR: 7
		};

	}

	/**
	 * @param {string} err The details of the error
	 * @param {number} code The error code
	 */
	constructor(err, code) {

		const message = err.message || err;

		super(message);
		this.message = message;
		this.code = code;
		this.name = 'EventBridgeEmitterError';

		if(err instanceof Error)
			this.previousError = err;
	}
};
