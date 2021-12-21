// Utility to make a Lambda function handler. Expects to be invoked in response
// to a message published to a FIFO SNS topic via SQS (which is the only valid
// destination for messages on FIFO topics). We expect all such messages to be
// encoded as JSON.
export default function handler(fn) {
  if (typeof fn !== 'function') {
    throw new Error('Expected a handler function.');
  }

  return async (snsRecord, sqsRecord) => {
    const message = JSON.parse(snsRecord?.Message);

    // Invoke the handler function with the parsed message data and the original
    // messages for advanced use cases. We don't care about the return value of
    // this function because we have to return the original SQS event object to
    // allow partial batch failures to be handled.
    fn(message, snsRecord, sqsRecord);

    // Return the original SQS message. This handler is expected to be used in
    // conjuction with the sqs-partial-batch-failure handler which uses this
    // record to remove successfully processed items from the queue.
    return sqsRecord;
  };
}
