import AWS from 'aws-sdk';

const SQS_BATCH_DELETE_CHUNK_SIZE = 10;

// Utility to make a Lambda function handler. Expects to be invoked in response
// to a message published to an SQS queue. We expect all such messages to be
// encoded as JSON.
export default function handler(fn, config = {}) {
  if (typeof fn !== 'function') {
    throw new Error('Expected a handler function.');
  }

  if (!config?.queueURL) {
    throw new Error('Expected an SQS queue URL.');
  }

  const sqs = config?.sqs ?? new AWS.SQS({
    apiVersion: '2012-11-05',
  });

  return async (event) => {
    const records = event?.Records;

    if (Array.isArray(records)) {
      const results = await Promise.allSettled(records.map((record) => {
        let message;

        try {
          message = JSON.parse(record?.body);
        } catch (err) {
          // If the request body can't be parsed as JSON we just pass undefined
          // to the handler function and leave it up to the function to respond
          // appropriately.
        }

        return fn(message, record);
      }));

      // Determine which records from the batch have been successfully processed
      // and delete them from the queue.
      const fulfilledPromises = results.filter((r) => r.status === 'fulfilled');
      const rejectedPromises = results.filter((r) => r.status === 'rejected');

      if (fulfilledPromises.length) {
        const batch = fulfilledPromises.map(({ value }, i) => ({
          Id: i.toString(),
          ReceiptHandle: value.receiptHandle,
        }));

        // The SQS batch delete API can only handle 10 messages at a time. It is
        // possible for the batch passed to the Lambda function to contain up to
        // 10,000 messages so we have to chunk the list of fulfilled promises to
        // delete the relevant messages in batches.
        const chunks = batch.reduce((arr, item, i) => {
          const chunkIndex = Math.floor(i / SQS_BATCH_DELETE_CHUNK_SIZE);

          arr[chunkIndex] = arr[chunkIndex] || []; // eslint-disable-line no-param-reassign
          arr[chunkIndex].push(item);

          return arr;
        }, []);

        // TODO: It is possible for this to fail, and it's also possible for it
        // to succeed overall but with individual message deletion failures. We
        // need to handle those failures in some way.
        await Promise.all(chunks.map((chunk) => sqs.deleteMessageBatch({
          QueueUrl: config.queueURL,
          Entries: chunk,
        }).promise()));
      }

      // If any records failed to process (if their handlers returned a promise
      // that was eventually rejected) we throw to mark the batch as a failure
      // and return any remaining records to the queue.
      if (rejectedPromises.length) {
        const reasons = rejectedPromises
          .map((promise) => promise?.reason?.message)
          .join('\n');

        throw new Error(`Some records failed to process: ${reasons}`);
      }
    }
  };
}
