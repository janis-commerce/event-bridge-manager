# Event-Bridge Manager

![Build Status](https://github.com/janis-commerce/event-bridge-manager/workflows/Build%20Status/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/event-bridge-manager/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/event-bridge-manager?branch=master)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fevent-bridge-manager.svg)](https://www.npmjs.com/package/@janiscommerce/event-bridge-manager)

A package to handle events from Event-Bridge AWS service in **Janis** Services.

This package helps to:
* emit events into an Event-Bridge Bus with with some standardization
* handle [Lambda Class](https://github.com/janis-commerce/lambda) for event-bridge consumers

## Installation

```sh
npm install @janiscommerce/event-bridge-manager
```

## Emit Events into Event-Bridge-Bus

You can use our function to emit events easiest, with some auto-complete data.

### WARNING!!!

You need to config some env variables to use it

* `JANIS_SERVICE_NAME` - to setup a source for the event
* `JANIS_ENV` - to setup a source for the event. otherwise will be used `local` as env
* `CENTRAL_BUS_ARN` - to setup a default bus

### Usage

In the package exists a class called `EventEmitter`, it has a method called `emit`.

* `EventEmitter.emit(eventToEmit)` | __ASYNC__
    * `eventToEmit`: _Object_ | __Required__
        * `name`: _string_ | __Required__ | the event name to emit
        * `clientCode`: _string_ | __Optional__ | the Session's client code, for emit an event for an specific client
        * `detail`: _Object_ | __Optional__ | the data you want to share through the event
        * `busArn`: _string_ | __Optional__ | an ARN from a Custom Bus where emit the event, by default the events are emitted to Janis Central Bus. It can be use if you want emit a local event (for the same service for example)

```js
const { EventEmitter } = require('@janiscommerce/event-bridge-manager');

// ... some process
// Emit an event for a Client with some data

const orderData = await this.getOrderDataToEmit();

await EventEmitter.emit({
    name: 'orderReady',
    detail: orderData,
    clientCode: this.session.clientCode
});

// ... other process
// Emit an event without Client

await EventEmitter.emit({
    name: 'warningMessage',
    detail: { message: 'Janis has a new update for the Apps' }
});

// ... more process
// Emit an event only by its name

await EventEmitter.emit({
    name: 'janisUpdated'
});

```

### Event Emitted

The event emitted has
* `source` as `janis.[SERVICE_NAME].[ENV]`
* `detail-type` with the `name` property (camelCase recommended)
* `detail` has
    * `id` an UUID. If you want to control the events for example not process repeated ones
    * `dateCreated` the date when the event has created. If you want to control not to process old events
    * `session` if the `clientCode` has been send
    * `body` if `details` has been send

### Local and Test Envs

In this Envs, the `EventEmitter.emit` function does not execute for prevent errors with trying to use real infra-structure.

In `'test'` Env, you can use `sinon.spy` functions (or equivalent in other testing-libs).

## Event Handler

The package contains a custom Handler function, in order to use [Lambda Package](https://github.com/janis-commerce/lambda) without problems and has every data from an event from an Event-Bridge Bus.

### Usage

The handler calls `EventHandler`.

In the Lambda class, `this.data` property will have `eventData` with event properties.

> This handler can be use for Janis standard (using previous event emitter), a generic event, or for no event consumer

### Example

* If the event is emitted with `EventEmitter`

```js
await EventEmitter.emit({
    name: 'orderReady',
    detail: {
        commerceId: '1000-1',
        status: 'picked',
        amount: 430.1
    },
    clientCode: 'testing'
});
```

The handler:

```js
const { EventHandler } = require('@janiscommerce/event-bridge-manager');
const { Lambda } = require('@janiscommerce/lambda');

class EventBridgeConsumerLambda extends Lambda {

    async process() {

        const session = this.session; // { clientCode: 'testing' }
        const { eventData, ...data } = this.data;

        /**
         * eventData has `id`, `dateCreated`,properties form the Event emitted and `name: 'orderReady'`, `source: 'janis.readme.test'`
         */

        /**
         * data:
         * {
         *   commerceId: '1000-1',
         *   status: 'picked',
         *   amount: 430.1
         * }
         */
    }

}

module.exports.handler = (...args) => EvenEventHandler.handle(EventBridgeConsumerLambda, args);

```

* If a generic event is listened:

```
{
    version: '0',
	id: '7354185a-d869-6c4a-9f88-c0e781b24509',
	account: '554433221100',
	time: '2024-06-06T10:00:00.010Z',
	region: 'us-east-2',
	resources: []
    detail-type: 'orderEmitted',
	source: 'platform.integration.com',
    detail: {
        id: '100000-Z',
        amount: 134.50,
        state: 'invoiced',
        account: 100
    }
}
```

In the handler

```js


const { EventHandler } = require('@janiscommerce/event-bridge-manager');
const { Lambda } = require('@janiscommerce/lambda');

class EventBridgeConsumerLambda extends Lambda {

    async process() {

        // No session can be used

        const { eventData, ...data } = this.data;

        /**
         * eventData has `name: 'orderEmitted'`, `source: 'platform.integration.com'`
         */

        /**
         * data has
         * {
         *    id: '100000-Z',
         *    amount: 134.50,
         *    state: 'invoiced',
         *    account: 100
         * }
         */
    }

}

module.exports.handler = (...args) => EvenEventHandler.handle(EventBridgeConsumerLambda, args);

```