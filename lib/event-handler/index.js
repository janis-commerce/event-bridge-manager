'use strict';

const { Handler } = require('@janiscommerce/lambda');

module.exports = class EventBridgeHandler extends Handler {

	static prepareEvent({
		detail = {}, // Event content
		source, // Event origin
		...event
	}) {

		const {
			session, body, id, dateCreated, service, ...customDetails
		} = detail;

		// Event Name
		const name = event['detail-type'];

		const eventData = {
			...id && { id },
			...dateCreated && { dateCreated },
			...source && { source },
			...name && { name },
			...service && { service }
		};

		return {
			...event,
			...session && { session },
			...this.shouldAddBody(eventData, customDetails, body) && {
				body: {
					...customDetails,
					...body,
					eventData
				}
			}
		};
	}

	static shouldAddBody(eventData, customDetails, body = {}) {
		return Object.values(eventData).length || Object.values(body).length || Object.values(customDetails).length;
	}
};
