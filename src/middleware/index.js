// Utility function to run a list of async middleware functions in sequence.
async function runMiddleware(stack, ...args) {
  for (const middleware of stack) {
    await middleware(...args);
  }
}

// A Middy-style middleware provider. Wraps a Lambda handler function and
// exposes an augmented function that manages stacks of middleware functions to
// execute before and after the wrapped handler.
//
// Example usage:
//
//   ```
//   const handler = async () => {
//     return { statusCode: 200 };
//   };
//
//   wrap(handler).with(exampleMiddleware);
//   ```
//
function wrap(handler) {
  if (typeof handler !== 'function') {
    throw new Error('Expected a handler function.');
  }

  const before = [];
  const after = [];
  const error = [];

  const wrappedHandler = async (event, context) => {
    const request = {
      response: null,
      error: null,
      context,
      event,
    };

    try {
      await runMiddleware(before.slice().reverse(), request);
      request.response = await handler(request.event, request.context);
      await runMiddleware(after, request);
    } catch (err) {
      // Reset any response provided before the error was thrown and capture the
      // error.
      request.response = null;
      request.error = err;

      // Attempt to run any error handling middleware. If this fails we augment
      // the new error with the original and rethrow.
      try {
        await runMiddleware(error, request);
      } catch (err) { // eslint-disable-line no-shadow
        err.originalError = request.error;
        request.error = err;

        throw request.error;
      }

      // If the error middleware has not provided a response all we can do is
      // rethrow.
      if (request.response === null) {
        throw request.error;
      }
    }

    return request.response;
  };

  const wrapWith = (middleware) => {
    if (middleware.before) {
      before.push(middleware.before);
    }

    if (middleware.after) {
      after.push(middleware.after);
    }

    if (middleware.error) {
      error.push(middleware.error);
    }

    return wrappedHandler;
  };

  // Expose the wrapping function under a couple of alias properties on the
  // returned handler function.
  wrappedHandler.use = wrapWith;
  wrappedHandler.with = wrapWith;

  return wrappedHandler;
}

export default wrap;
