// Middleware provider. Wraps a Lambda function handler and manages a stack of
// middleware functions called prior to and after execution of the handler
// itself.
export { default as wrap } from './middleware';

// Lambda handlers. These are wrappers for Lambda functions themselves that
// perform common logic such as request parsing.
export { default as handleJSON } from './lambda-handlers/json';
export { default as handleSNS } from './lambda-handlers/sns';
export { default as handleSNSFIFO } from './lambda-handlers/sns-fifo';
export { default as handleSQSPartialBatchFailure } from './lambda-handlers/sqs-partial-batch-failure';
export { default as handleURLEncoding } from './lambda-handlers/url-encoding';

// Lambda responses. These are utility functions for generating the return
// values of Lambda functions.
export { default as responseJSON } from './lambda-responses/json';

// DynamoDB utility. A thin wrapper around the DynamoDB document client from the
// AWS SDK. Automatically handles tasks like pagination and always returns
// promises.
export { default as createDynamoDBClient } from './dynamodb';
