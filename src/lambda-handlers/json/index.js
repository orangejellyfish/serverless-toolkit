// Utility to make a Lambda function handler. Expects to be invoked in response
// to an API Gateway event of Content-Type application/json.
export default function handler(fn) {
  if (typeof fn !== 'function') {
    throw new Error('Expected a handler function.');
  }

  return async (event, ...args) => {
    let requestBody;

    try {
      requestBody = JSON.parse(event.body);
    } catch (err) {
      // If the request body can't be parsed as JSON we just pass undefined to
      // the handler function and leave it up to the function to response
      // appropriately (probably with a 400 Bad Request status).
    }

    return fn(requestBody, event, ...args);
  };
}

// Middleware-compatible version of the above utility.
export const httpJSONHandler = () => {
  const handleBefore = async (request) => {
    try {
      request.event.body = JSON.parse(request.event.body);
    } catch (err) {
      const error = new Error('Cannot parse request body as JSON', {
        cause: err,
      });

      error.statusCode = 400;
      throw new Error('Cannot parse request body as JSON');
    }
  };

  return {
    before: handleBefore,
  };
};
