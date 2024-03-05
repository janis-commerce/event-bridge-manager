'use strict';

module.exports = class EventBridgeEmitterError extends Error {

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
