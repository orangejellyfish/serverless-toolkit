import makeHandler from '.';

describe('[Utility: Handlers]', () => {
  describe('SNS message handler', () => {
    it('should throw if not passed a handler function', () => {
      expect(makeHandler).toThrow(/function/);
    });

    it('should return an augmented handler function', () => {
      expect(makeHandler(() => {})).toBeInstanceOf(Function);
    });

    it('should pass an object to the handler function if the message can be parsed as JSON', async () => {
      const mockEvent = {
        Records: [
          {
            Sns: {
              Message: '{"valid": "JSON"}',
            },
          },
        ],
      };
      const handler = jest.fn();
      const wrappedHandler = makeHandler(handler);

      await wrappedHandler(mockEvent);
      expect(handler.mock.calls[0][0]).toEqual({ valid: 'JSON' });
    });

    it('should pass undefined to the handler function if the message cannot be parsed as JSON', async () => {
      const mockEvent = {
        Records: [
          {
            Sns: {
              Message: '{"invalidJSON"}',
            },
          },
        ],
      };
      const handler = jest.fn().mockReturnValue({

      });
      const wrappedHandler = makeHandler(handler);

      await wrappedHandler(mockEvent);
      expect(handler.mock.calls[0][0]).toBe(undefined);
    });
  });
});
