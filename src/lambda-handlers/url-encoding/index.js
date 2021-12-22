import qs from 'querystring';

// Utility to make a Lambda function handler. Expects to be invoked in response
// to an API Gateway event of Content-Type application/x-www-form-urlencoded.
export default function handler(fn) {
  if (typeof fn !== 'function') {
    throw new Error('Expected a handler function.');
  }

  return async (event) => {
    const requestBody = qs.parse(event.body);

    return fn(requestBody, event.pathParameters);
  };
}
