# serverless-toolkit

A set of opinionated tools and utilities for the [Serverless Framework][sls], in
particular for Node.js Lambda functions running in AWS.

## Usage

Install the package from npm with `npm i @orangejellyfish/serverless-toolkit`.

## Lambda function handlers

All of the handler factories are exported as named exports and expect a handler
function. They cover a range of common methods by which AWS Lambda functions may
be invoked and pull requests are welcomed for further methods not yet covered by
this toolkit.

### `handleJSON`

Creates a Lambda function handler that is expected to be invoked in response to
an HTTP request via the AWS API Gateway with a `Content-Type` header with value
`application/json`.

The handler will be invoked with the parsed JSON body of the request and the
raw API Gateway event object which is useful if you need to access other parts
of the request in your handler.

```js
import { handleJSON } from '@orangejellyfish/serverless-toolkit';

export default handleJSON(async (body, event) => {
  return {
    statusCode: 200,
  };
});
```

### `handleURLEncoding`

Creates a Lambda function handler that is expected to be invoked in response to
an HTTP request via the AWS API Gateway with a `Content-Type` header with value
`application/x-www-form-urlencoded`.

The handler will be invoked with the parsed JSON body of the request and the
raw API Gateway event object which is useful if you need to access other parts
of the request in your handler.

```js
import { handleURLEnconding } from '@orangejellyfish/serverless-toolkit';

export default handleURLEnconding(async (body, event) => {
  return {
    statusCode: 200,
  };
});
```

### `handleSNS`

Creates a Lambda function handler that is expected to be invoked in response to
a message made up of a JSON string being published to an AWS SNS topic.

The handler will be invoked with the parsed JSON body of the message.

```js
import { handleSNS } from '@orangejellyfish/serverless-toolkit';

export default handleSNS(async (message, event) => {
  return null;
});
```

### `handleSNSFIFO`

Creates a Lambda function handler that is expected to be invoked in response to
a message being published to an AWS SNS FIFO topic. Since the only valid
destination for messages on FIFO topics is an SQS FIFO queue this utility is
expected to be used in conjunction with `handleSQSPartialBatchFailure`.

The handler will be invoked with the parsed JSON body of the message and the
original events from SNS and SQS. The return value of the handler is ignored and
the original SQS event object is passed back to the SQS partial batch failure
handler.

```js
import { handleSNSFIFO, handleSQSPartialBatchFailure } from '@orangejellyfish/serverless-toolkit';

export default handleSQSPartialBatchFailure(
  handleSNSFIFO(async (message, snsRecord, sqsRecord) => {
    return null;
  }),
  {
    queueURL: process.env.QUEUE_URL,
  },
);
```

### `handleSQSPartialBatchFailure`

Creates a Lambda function handler that is expected to be invoked in response to
a batch of messages on an SQS queue. Automatically removes successfully handled
messages from the queue and throws any failures to ensure those messages are
returned to the queue for later processing.

```js
import { handleSQSPartialBatchFailure } from '@orangejellyfish/serverless-toolkit';

export default handleSQSPartialBatchFailure(async (message, sqsRecord) => {
  return null;
}, {
  queueURL: process.env.QUEUE_URL,
});
```

## Lambda function response utilities

### `responseJSON`

Produce an object of the format expected by a Lambda function that has been
invoked in response to an HTTP request via API Gateway. Intended to work hand
in hand with the `handleJSON` handler factory.

```js
import { handleJSON, responseJSON } from '@orangejellyfish/serverless-toolkit';

export default handleJSON(async (body, event) => {
  return responseJSON(200, {
    hello: 'world',
  });
});
```

[sls]: https://serverless.com/framework/
