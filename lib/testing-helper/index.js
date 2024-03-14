'use strict';

const crypto = require('crypto');

module.exports = ({
	eventId = crypto.randomUUID(),
	eventDateCreated,
	eventName = 'testExecuted',
	eventSource = 'janis.default.test',
	clientCode,
	body
} = {}) => {

	const dateCreated = eventDateCreated || new Date();

	return {
		version: '0',
		id: '7354185a-d869-6c4a-9f88-c0e781b24509',
		account: '554433221100',
		time: dateCreated,
		region: 'us-east-3',
		resources: [],
		'detail-type': eventName,
		source: eventSource,
		detail: {
			id: eventId,
			dateCreated,
			...clientCode && { session: { clientCode } },
			...body && { body }
		}
	};
};
