import makeHandler from '.';

describe('[Utility: Handlers]', () => {
  describe('SNS FIFO topic message handler', () => {
    it('should throw if not passed a handler function', () => {
      expect(makeHandler).toThrow(/function/);
    });

    it('should return an augmented handler function', () => {
      expect(makeHandler(() => {})).toBeInstanceOf(Function);
    });

    it('should pass an object to the handler function if the message can be parsed as JSON', async () => {
      const mockMessage = { foo: 'bar' };
      const mockEvent = {
        Message: JSON.stringify(mockMessage),
      };
      const handler = jest.fn();
      const wrappedHandler = makeHandler(handler);

      await wrappedHandler(mockEvent);
      expect(handler.mock.calls[0][0]).toEqual(mockMessage);
    });

    it('should pass the original event objects to the handler function', async () => {
      const mockSNSEvent = {
        Message: JSON.stringify({ foo: 'bar' }),
      };
      const mockSQSEvent = { foo: 'bar' };
      const handler = jest.fn();
      const wrappedHandler = makeHandler(handler);

      await wrappedHandler(mockSNSEvent, mockSQSEvent);
      expect(handler.mock.calls[0][1]).toEqual(mockSNSEvent);
      expect(handler.mock.calls[0][2]).toEqual(mockSQSEvent);
    });
  });
});
