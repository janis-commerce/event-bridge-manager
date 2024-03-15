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
    * `service` the name of the service that emit the event
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
         * eventData has `id`, `dateCreated`,properties form the Event emitted and `name: 'orderReady'`, `source: 'janis.readme.test'` and `service: 'readme'`
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

## Testing Helper

The final tool in this package is a helper for the unit tests of the Handler function.

The function is called `eventTestMaker`, and it generate an event object with the properties as if an event was emitted with `EventEmitter`.

* `eventTestMaker(eventProperties)` -> __returns__ _Object_
    * `eventProperties` | _Object_
        * `eventId` | _string_ | __Optional__ | the autogenerated UUID in `EventEmitter`, if it is not passed a random UUID will be generated
        * `eventDateCreated` | _Date_ | __Optional__ | the event's creation date, if it is not passed will used `Date.now`
        * `eventName` | _string_ | __Optional__ | the name of the event, by default will use `testExecuted`
        * `eventService` | _string_ | __Optional__ | the name of the service that emit the event, it will set the `source` as `janis.[eventService].test`, by default will use `default` as service name
        * `eventSource` | _string_ | __Optional__ | an event's source, if `eventService` is not passed will use it, and if both are not passed by default will use `janis.default.test`
        * `clientCode` | _string_ | __Optional__ | The client code, to setup the Session. No default value will be used.
        * `body` | _Object_ | __Optional__ | The data to shared through the event. No default value will be used.

### Object returned examples

* `eventTestMaker()` | No properties are passed.

```js
{
    // Basic Object to simulate real event but has no impact in the handlers generally.
    version: '0',
    id: '7354185a-d869-6c4a-9f88-c0e781b24509',
    account: '554433221100',
    time: '2024-06-01T10:30:01.010Z', // Use Date.now for this
    region: 'us-east-3',
    resources: [],
    // Event propierties
    'detail-type': 'testExecuted',
    source: 'janis.default.test,
    detail: {
        id: '3c262ea1-1c94-47eb-bea8-3499e8ace2d9', // Random UUID
        dateCreated: '2024-06-01T10:30:01.010Z', // Use Date.now for this
        service: 'default'
    }
}
```

* `eventTestMaker({ eventName: 'warehouseSaved', eventService: 'wms' })` | Passed Event Name and Service

```js
{
    // Basic Object to simulate real event but has no impact in the handlers generally.
    version: '0',
    id: '7354185a-d869-6c4a-9f88-c0e781b24509',
    account: '554433221100',
    time: '2024-06-01T10:30:01.010Z',
    region: 'us-east-3',
    resources: [],
    // Event properties
    'detail-type': 'warehouseSaved',
    source: 'janis.wms.test',
    detail: {
        id: '3c262ea1-1c94-47eb-bea8-3499e8ace2d9',
        dateCreated: '2024-06-01T10:30:01.010Z',
        service: 'wms'
    }
}
```

* `eventTestMaker({ eventName: 'warehouseSaved', eventService: 'wms', clientCode: 'defaultClient', body: sampleWarehouse })` | Passed Event Name, Service and Client with a Body. Probably the most common use

```js
{
    // Basic Object to simulate real event but has no impact in the handlers generally.
    version: '0',
    id: '7354185a-d869-6c4a-9f88-c0e781b24509',
    account: '554433221100',
    time: '2024-06-01T10:30:01.010Z',
    region: 'us-east-3',
    resources: [],
    // Event properties
    'detail-type': 'warehouseSaved',
    source: 'janis.wms.test',
    detail: {
        id: '3c262ea1-1c94-47eb-bea8-3499e8ace2d9',
        dateCreated: '2024-06-01T10:30:01.010Z',
        service: 'wms',
        session: { clientCode: 'defaultClient' },
        body: {
            ...sampleWarehouse
        }
    }
}
```


### Usage

```js
const { eventTestMaker } = require('@janiscommerce/event-bridge-manager');
const assert = require('assert');

const { handler } = require('../events/TestHandler');

describe('Test Handler', () => {

    it('Should return ... when no data is passed in the helper', async () => {

        assert.deepStrictEqual(await handler(eventTestMaker(), {... }));
    });

    it('Should return ... when data is passed in the helper', async () => {

        assert.deepStrictEqual(await handler(eventTestMaker({
            name: 'wmsSaved',
            service: 'wms',
            clientCode: 'defaultClient',
            body: {
                id: 'warehouse-id',
                referenceId: 'wh-101',
                nearWarehouses: ['warehouse-id-2'],
                status: 'active'
            }
        }), {... }));
    });

});

```
