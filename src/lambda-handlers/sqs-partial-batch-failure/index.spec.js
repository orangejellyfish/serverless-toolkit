import makeHandler from '.';

const queueURL = 'https://example.com';

const mockSend = jest.fn();

jest.mock('../../util/clients/sqs', () => {
  const actualSQSClientModule = jest.requireActual('../../util/clients/sqs');

  return {
    ...actualSQSClientModule,
    __esModule: true,
    default: jest.fn(() => ({
      send: mockSend,
    })),
  };
});

describe.only('[Utility: Handlers]', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  describe('SQS message handler', () => {
    it('should throw if not passed a handler function', () => {
      expect(makeHandler).toThrow(/function/);
    });

    it('should throw if not passed a queue URL', () => {
      const test = () => makeHandler(() => {});
      expect(test).toThrow(/queue URL/);
    });

    it('should return an augmented handler function', () => {
      expect(makeHandler(() => {}, { queueURL })).toBeInstanceOf(Function);
    });

    it('should pass an object to the handler function if the message can be parsed as JSON', async () => {
      const mockEvent = {
        Records: [
          {
            body: '{"valid": "JSON"}',
            receiptHandle: 'foo',
          },
        ],
      };
      const handler = jest.fn(async (message, record) => record);
      const wrappedHandler = makeHandler(handler, { queueURL });

      await wrappedHandler(mockEvent);
      expect(handler.mock.calls[0][0]).toEqual({ valid: 'JSON' });
    });

    it('should pass undefined to the handler function if the message cannot be parsed as JSON', async () => {
      const mockEvent = {
        Records: [
          {
            body: '{"invalidJSON"}',
            receiptHandle: 'foo',
          },
        ],
      };
      const handler = jest.fn(async (message, record) => record);
      const wrappedHandler = makeHandler(handler, { queueURL });

      await wrappedHandler(mockEvent);
      expect(handler.mock.calls[0][0]).toBe(undefined);
    });

    it('should ignore malformed events', async () => {
      const mockEvent = {};
      const handler = jest.fn(async (message, record) => record);
      const wrappedHandler = makeHandler(handler, { queueURL });

      await wrappedHandler(mockEvent);
      expect(handler.mock.calls.length).toBe(0);
    });

    it('should delete messages that were successfully processed', async () => {
      const mockEvent = {
        Records: [
          {
            body: '{"valid": "JSON"}',
            receiptHandle: 'foo',
          },
          {
            body: '{"valid": "JSON"}',
            receiptHandle: 'bar',
          },
        ],
      };
      const handler = jest.fn(async (message, record) => record);
      const wrappedHandler = makeHandler(handler, { queueURL });

      await wrappedHandler(mockEvent);
      expect(mockSend.mock.calls[0][0].input).toEqual({
        QueueUrl: queueURL,
        Entries: [
          {
            Id: '0',
            ReceiptHandle: 'foo',
          },
          {
            Id: '1',
            ReceiptHandle: 'bar',
          },
        ],
      });
    });

    it('should chunk message delete calls', async () => {
      const mockEvent = {
        Records: new Array(25).fill({
          body: '{"valid": "JSON"}',
          receiptHandle: 'foo',
        }),
      };

      const handler = jest.fn(async (message, record) => record);
      const wrappedHandler = makeHandler(handler, { queueURL });

      await wrappedHandler(mockEvent);
      // expect(mockSQSDeleteMessageBatch).toHaveBeenCalledTimes(3);
    });

    it('should throw if any messages could not be processed', async () => {
      const mockEvent = {
        Records: [
          {
            body: '{"succeed": false}',
            receiptHandle: 'foo',
          },
        ],
      };
      const handler = jest.fn(async (message, record) => {
        if (message.succeed) {
          return record;
        }
        throw new Error('failure');
      });
      const wrappedHandler = makeHandler(handler, { queueURL });
      const expectedError = new Error('Some records failed to process: failure');

      await expect(wrappedHandler(mockEvent)).rejects.toEqual(expectedError);
    });
  });
});
