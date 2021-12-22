import makeHandler from '.';

describe('[Utility: Handlers]', () => {
  describe('URL-encoded request handler', () => {
    it('should throw if not passed a handler function', () => {
      expect(makeHandler).toThrow(/function/);
    });

    it('should return an augmented handler function', () => {
      expect(makeHandler(() => {})).toBeInstanceOf(Function);
    });

    it('should pass an object of parsed URL-encoded values to the handler function', async () => {
      const mockEvent = {
        body: 'foo=bar&baz=foo',
      };
      const handler = jest.fn().mockReturnValue({});
      const wrappedHandler = makeHandler(handler);

      await wrappedHandler(mockEvent);
      expect(handler.mock.calls[0][0]).toEqual({
        foo: 'bar',
        baz: 'foo',
      });
    });
  });
});
