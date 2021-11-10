# serverless-handlers

A set of [Serverless Framework][sls] handler function factories covering a range
of common ways in which AWS Lambda functions can be invoked.

## Usage

Install the package from npm with `npm i @orangejellyfish/serverless-handlers`.
All of the handler factories are exported as named exports and expect a handler
function:

```js
import { handleJSON } from '@orangejellyfish/serverless-handlers';

export default handleJSON(async (body) => {
  return {
    statusCode: 200,
  };
});
```

## Available handler factories

We expect the number of available factories to increase over time as we come
across more use cases.

### `handleJSON`

Creates a Lambda function handler that is expected to be invoked in response to
an HTTP request via the AWS API Gateway with a `Content-Type` header with value
`application/json`.

The handler will be invoked with the parsed JSON body of the request and the
raw API Gateway event object which is useful if you need to access other parts
of the request in your handler.

### `handleURLEncoding`

Creates a Lambda function handler that is expected to be invoked in response to
an HTTP request via the AWS API Gateway with a `Content-Type` header with value
`application/x-www-form-urlencoded`.

The handler will be invoked with the parsed JSON body of the request and the
raw API Gateway event object which is useful if you need to access other parts
of the request in your handler.

### `handleSNS`

Creates a Lambda function handler that is expected to be invoked in response to
a message being published to an AWS SNS topic.

The handler will be invoked with the parsed JSON body of the message.

### `handleSQSPartialBatchFailure`

Creates a Lambda function handler that is expected to be invoked in response to
a batch of messages on an SQS queue. Automatically removes successfully handled
messages from the queue and throws any failures to ensure those messages are
returned to the queue for later processing.

## Additional utilities

### `responseJSON`

Produce an object of the format expected by a Lambda function that has been
invoked in response to an HTTP request via API Gateway. Intended to work hand
in hand with the `handleJSON` handler factory.

[sls]: https://serverless.com/framework/
