// Utility to make a Lambda function handler. Expects to be invoked in response
// to a message published to an SNS topic. We expect all such messages to be
// encoded as JSON.
export default function handler(fn) {
  if (typeof fn !== 'function') {
    throw new Error('Expected a handler function.');
  }

  return async (event) => {
    let message;

    // Attempt to parse the message as JSON. The "Records" provided on the event
    // received by the Lambda is an array but SNS guarantees that it will only
    // ever contain a single element. See https://aws.amazon.com/sns/faqs for
    // details.
    try {
      message = JSON.parse(event.Records[0].Sns.Message);
    } catch (err) {
      // If the request body can't be parsed as JSON we just pass undefined to
      // the handler function and leave it up to the function to response
      // appropriately (probably with a 400 Bad Request status).
    }

    return fn(message, event);
  };
}
