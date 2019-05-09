import makeHandler from '.';

describe('JSON request handler', () => {
  it('should throw if not passed a handler function', () => {
    expect(makeHandler).toThrow(/function/);
  });

  it('should return an augmented handler function', () => {
    expect(makeHandler(() => {})).toBeInstanceOf(Function);
  });

  it('should pass undefined to the handler function if the request body cannot be parsed as JSON', async () => {
    const mockEvent = {
      body: '{"invalidJSON"}',
    };
    const handler = jest.fn().mockReturnValue({

    });
    const wrappedHandler = makeHandler(handler);

    await wrappedHandler(mockEvent);
    expect(handler.mock.calls[0][0]).toBe(undefined);
  });
});
