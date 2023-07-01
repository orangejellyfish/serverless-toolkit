import wrap from '.';

describe('Middleware wrapper', () => {
  it('should throw if not passed a handler function', () => {
    expect(wrap).toThrow(/function/);
  });

  it('should return an augmented handler function', () => {
    expect(wrap(() => {})).toBeInstanceOf(Function);
  });

  it('should expose the middleware wrapper as "use"', () => {
    expect(wrap(() => {})).toHaveProperty('use');
  });

  it('should expose the middleware wrapper as "with"', () => {
    expect(wrap(() => {})).toHaveProperty('with');
  });

  it('should invoke the wrapped handler', async () => {
    const mockEvent = { mock: 'event' };
    const mockContext = { mock: 'context' };
    const handler = jest.fn();
    const wrappedHandler = wrap(handler);

    await wrappedHandler(mockEvent, mockContext);
    expect(handler).toHaveBeenCalled();
  });

  it('should provide a request object to a middleware before function', async () => {
    const mockEvent = { mock: 'event' };
    const mockContext = { mock: 'context' };
    const handler = jest.fn();
    const mockMiddlewareBefore = jest.fn();
    const mockMiddleware = () => ({
      before: mockMiddlewareBefore,
    });
    const wrappedHandler = wrap(handler).with(mockMiddleware());

    await wrappedHandler(mockEvent, mockContext);
    expect(mockMiddlewareBefore.mock.calls[0][0]).toMatchObject({
      event: mockEvent,
      context: mockContext,
    });
  });

  it('should provide a request object to a middleware after function', async () => {
    const mockEvent = { mock: 'event' };
    const mockContext = { mock: 'context' };
    const handler = jest.fn();
    const mockMiddlewareAfter = jest.fn();
    const mockMiddleware = () => ({
      after: mockMiddlewareAfter,
    });
    const wrappedHandler = wrap(handler).with(mockMiddleware());

    await wrappedHandler(mockEvent, mockContext);
    expect(mockMiddlewareAfter.mock.calls[0][0]).toMatchObject({
      event: mockEvent,
      context: mockContext,
    });
  });

  it('should provide an event and context object to the handler function', async () => {
    const mockEvent = { mock: 'event' };
    const mockContext = { mock: 'context' };
    const handler = jest.fn();
    const mockMiddleware = () => ({});
    const wrappedHandler = wrap(handler).with(mockMiddleware());

    await wrappedHandler(mockEvent, mockContext);
    expect(handler.mock.calls[0][0]).toMatchObject(mockEvent);
    expect(handler.mock.calls[0][1]).toMatchObject(mockContext);
  });

  it('should allow middleware to modify the context object', async () => {
    const mockEvent = { mock: 'event' };
    const mockContext = { mock: 'context' };
    const handler = jest.fn();
    const mockMiddleware = () => ({
      before: (request) => {
        request.context.foo = 'bar';
      },
    });
    const wrappedHandler = wrap(handler).with(mockMiddleware());

    await wrappedHandler(mockEvent, mockContext);
    expect(handler.mock.calls[0][1]).toMatchObject({
      foo: 'bar',
    });
  });

  it('should run middleware after the handler function', async () => {
    const mockResponse = { foo: 'bar' };
    const handler = jest.fn().mockReturnValue(mockResponse);
    const mockMiddleware = () => ({
      after: (context) => {
        context.response = JSON.stringify(context.response);
      },
    });
    const wrappedHandler = wrap(handler).with(mockMiddleware());
    const result = await wrappedHandler();

    expect(result).toBe(JSON.stringify(mockResponse));
  });

  it('should run middleware if the handler throws', async () => {
    const mockErrorHandler = jest.fn().mockImplementation((request) => {
      request.response = request.error;
    });
    const mockError = new Error('mock');
    const handler = jest.fn().mockImplementation(() => {
      throw mockError;
    });
    const mockMiddleware = () => ({
      error: mockErrorHandler,
    });
    const wrappedHandler = wrap(handler).with(mockMiddleware());

    await wrappedHandler();
    expect(mockErrorHandler.mock.calls[0][0]).toMatchObject({
      error: mockError,
    });
  });

  it('should rethrow if error middleware throws', async () => {
    const mockErrorHandler = jest.fn().mockImplementation(() => {
      throw new Error('error middleware error');
    });
    const mockError = new Error('mock');
    const handler = jest.fn().mockImplementation(() => {
      throw mockError;
    });
    const mockMiddleware = () => ({
      error: mockErrorHandler,
    });
    const wrappedHandler = wrap(handler).with(mockMiddleware());

    expect(wrappedHandler).rejects.toMatchObject({
      message: 'error middleware error',
      originalError: mockError,
    });
  });

  it('should rethrow if error middleware fails to return a response', async () => {
    const mockErrorHandler = jest.fn().mockImplementation((request) => {
      request.response = null;
    });
    const mockError = new Error('mock');
    const handler = jest.fn().mockImplementation(() => {
      throw mockError;
    });
    const mockMiddleware = () => ({
      error: mockErrorHandler,
    });
    const wrappedHandler = wrap(handler).with(mockMiddleware());

    expect(wrappedHandler).rejects.toThrow(mockError);
  });
});
