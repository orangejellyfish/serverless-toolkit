// Utility to produce a response object of the format expected by a Lambda that
// has been invoked in response to an HTTP request via API Gateway. Intended to
// work hand in hand with the `json` handler module from this package.
export default (statusCode, body, opts) => {
  const response = {
    statusCode,
  };

  if (body) {
    if (typeof body === 'object') {
      response.body = JSON.stringify(body);
    } else {
      response.body = body;
    }
  }

  if (opts) {
    Object.assign(response, opts);
  }

  // TODO: Make this a bit safer. We currently allow CORS requests from any
  // domain but we could make this configurable.
  response.headers = response.headers || {};
  response.headers['Access-Control-Allow-Origin'] = '*';
  response.headers['Access-Control-Allow-Credentials'] = true;

  return response;
};
