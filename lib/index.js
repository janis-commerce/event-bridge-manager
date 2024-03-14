'use strict';

const EventEmitter = require('./event-emitter');
const EventHandler = require('./event-handler');
const testEventMaker = require('./testing-helper');

module.exports = {
	EventEmitter,
	EventHandler,
	testEventMaker
};
