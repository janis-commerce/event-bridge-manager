'use strict';

const { Handler } = require('@janiscommerce/lambda');

module.exports = class EventBridgeHandler extends Handler {

	static prepareEvent({
		detail,
		source,
		...event
	}) {

		const { session, body, id, dateCreated } = detail;

		return {
			...event,
			...session && { session },
			body: {
				...body && body,
				eventData: {
					id,
					dateCreated,
					name: event['detail-type'],
					source
				}
			}
		};
	}
};
