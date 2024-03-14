'use strict';

const testEventMaker = require('../../lib/testing-helper');

const dateNow = new Date();

const serviceName = 'JCN';
const envName = 'test';
const clientCode = 'defaultClient';

const eventData = {
	id: 'c7056eb7-e211-442a-9176-053a4eb092ee',
	dateCreated: dateNow,
	name: 'testExecuted',
	source: `janis.${serviceName}.${envName}`
};

const awsBaseEvent = {
	version: '0',
	id: '7354185a-d869-6c4a-9f88-c0e781b24509',
	account: '554433221100',
	time: dateNow,
	region: 'arg-east-x',
	resources: []
};

const sampleOrder = {
	id: '6df3167e8579064a2884a46a',
	status: 'picking',
	commerceId: 'ORD-240000-YNZZZZ'
};

module.exports = {
	utils: {
		serviceName,
		envName,
		dateNow,
		clientCode,
		sampleOrder
	},
	eventData,
	awsBaseEvent,
	awsLambdaEvent: {
		...awsBaseEvent,
		session: { clientCode },
		body: { ...sampleOrder }
	},
	eventBridgeGeneric: {
		...awsBaseEvent,
		'detail-type': eventData.name,
		source: eventData.source
	},
	eventBridgeComplete: testEventMaker({
		eventName: eventData.name,
		eventSource: eventData.source,
		eventId: eventData.id,
		eventDateCreated: eventData.dateCreated,
		body: { ...sampleOrder },
		clientCode
	}),
	eventBridgeWithoutSession: testEventMaker({
		eventName: eventData.name,
		eventSource: eventData.source,
		eventId: eventData.id,
		eventDateCreated: eventData.dateCreated,
		body: { message: 'Janis will be closed until next Sunday' }
	}),
	eventBridgeWithoutBody: testEventMaker({
		eventName: eventData.name,
		eventSource: eventData.source,
		eventId: eventData.id,
		eventDateCreated: eventData.dateCreated,
		clientCode
	}),
	eventBridgeWithoutBodyAndSession: testEventMaker({
		eventName: eventData.name,
		eventSource: eventData.source,
		eventId: eventData.id,
		eventDateCreated: eventData.dateCreated
	})
};