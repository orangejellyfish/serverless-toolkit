import dynamodb from '.';

const mockSend = jest.fn();

jest.mock('../util/clients/dynamodb', () => {
  const actualDDBClientModule = jest.requireActual('../util/clients/dynamodb');

  return {
    ...actualDDBClientModule,
    __esModule: true,
    default: jest.fn(() => ({
      send: mockSend,
    })),
  };
});

describe('dynambo db utility', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  describe('put', () => {
    it('should throw if you try to put an item without params', async () => {
      const client = dynamodb();
      expect(client.put())
        .rejects
        .toThrow('Missing required params');
    });

    it('should put an item with params', async () => {
      const client = dynamodb();
      await client.put({ TableName: 'testTable', Items: { foo: '1', bar: '2' } });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'testTable',
            Items: { foo: '1', bar: '2' },
          }),
        }),
      );
    });
  });

  describe('get', () => {
    it('should throw if you try to get an item without params', async () => {
      const client = dynamodb();
      expect(client.get())
        .rejects
        .toThrow('Missing required params');
    });

    it('should get an item with params', async () => {
      mockSend.mockImplementation(() => ({
        Item: { foo: '1', bar: '2' },
      }));

      const client = dynamodb();
      const result = await client.get({ TableName: 'testTable', Items: { foo: '1', bar: '2' } });
      expect(result).toEqual({ foo: '1', bar: '2' });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'testTable',
            Items: { foo: '1', bar: '2' },
          }),
        }),
      );
    });
    it('should get null response if no items can be found', async () => {
      mockSend.mockImplementation(() => null);

      const client = dynamodb();
      const result = await client.get({ TableName: 'testTable', Items: { foo: '1', bar: '2' } });
      expect(result).toBeNull();
    });
  });

  describe('batchGet', () => {
    it('should throw if you try to get an item without params', async () => {
      const client = dynamodb();
      expect(client.batchGet())
        .rejects
        .toThrow('Missing required table parameter');
    });

    it('should throw if you try to get an item without params', async () => {
      const client = dynamodb();
      expect(client.batchGet({}))
        .rejects
        .toThrow('Missing required keys parameter');
    });

    it('should throw if you try to get an item without params', async () => {
      const client = dynamodb();
      expect(client.batchGet({}, {}))
        .rejects
        .toThrow('Missing required params parameter');
    });
    it('should get 5 items correctly and reprocess unprocessed items', async () => {
      mockSend.mockReturnValueOnce({
        Responses: {
          Music: [
            {
              AlbumTitle: {
                S: 'Somewhat Famous',
              },
            },
            {
              AlbumTitle: {
                S: 'Blue Sky Blues',
              },
            },
            {
              AlbumTitle: {
                S: 'Louder Than Ever',
              },
            },
          ],
        },
        UnprocessedKeys: {
          Music: {
            Keys: [{
              Artist: {
                S: 'Bad Artist',
              },
            }],
          },
        },
      }).mockReturnValueOnce({
        Responses: {
          Music: [
            {
              AlbumTitle: {
                S: 'Found it',
              },
            },
          ],
          UnprocessedKeys: {
          },
        },
      });

      const client = dynamodb();
      const result = await client.batchGet(
        'Music',
        [{
          Artist: {
            S: 'No One You Know',
          },
          SongTitle: {
            S: 'Call Me Today',
          },
        },
        {
          Artist: {
            S: 'Acme Band',
          },
          SongTitle: {
            S: 'Happy Day',
          },
        },
        {
          Artist: {
            S: 'No One You Know',
          },
          SongTitle: {
            S: 'Scared of My Shadow',
          },
        }],
        {},
      );
      expect(result).toEqual([{ AlbumTitle: { S: 'Somewhat Famous' } }, { AlbumTitle: { S: 'Blue Sky Blues' } }, { AlbumTitle: { S: 'Louder Than Ever' } }, {
        AlbumTitle: {
          S: 'Found it',
        },
      }]);
    });
  });

  describe('batchWrite', () => {
    it('should throw if you try to batchWrite an item without params', async () => {
      const client = dynamodb();
      expect(client.batchWrite())
        .rejects
        .toThrow('Missing required table parameter');
    });

    it('should throw if you try to batchWrite an item without items', async () => {
      const client = dynamodb();
      expect(client.batchWrite({}))
        .rejects
        .toThrow('Missing required items parameter');
    });

    it('should batchWrite 26 items correctly and reprocess unprocessed items', async () => {
      mockSend.mockReturnValueOnce({
        UnprocessedItems: {
          Music: {
            Keys: [{
              Artist: {
                S: 'Bad Artist',
              },
            }],
          },
        },
      }).mockReturnValue({
        UnprocessedItems: {
        },
      });

      const items = (new Array(26)).fill({ test: 1 });
      const client = dynamodb();
      await client.batchWrite(
        'Music',
        items,
      );
      // 26 items, 25 in first batch, 1 in second that fails, then 1 more
      expect(mockSend).toHaveBeenCalledTimes(3);
    });
  });

  describe('delete', () => {
    it('should throw if you try to delete an item without params', async () => {
      const client = dynamodb();
      expect(client.delete())
        .rejects
        .toThrow('Missing required params');
    });

    it('should delete an item with params', async () => {
      mockSend.mockImplementation(() => ({
        Item: { foo: '1', bar: '2' },
      }));

      const client = dynamodb();
      await client.delete({ TableName: 'testTable', Items: { foo: '1', bar: '2' } });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'testTable',
            Items: { foo: '1', bar: '2' },
          }),
        }),
      );
    });
  });

  describe('scan', () => {
    it('should throw if you try to scan an item without params', async () => {
      const client = dynamodb();
      expect(client.scan())
        .rejects
        .toThrow('Missing required params');
    });

    it('should scan a table with params', async () => {
      mockSend.mockReturnValueOnce({
        LastEvaluatedKey: {
          bar: '2',
        },
        Items: [{
          foo: '1',
          bar: '2',
        }],
      }).mockReturnValue({
        Items: [{
          foo: '3',
          bar: '4',
        }],
      });

      const client = dynamodb();
      await client.scan({ TableName: 'testTable', Items: { foo: '1', bar: '2' } });
      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('query', () => {
    it('should throw if you try to query an item without params', async () => {
      const client = dynamodb();
      expect(client.query())
        .rejects
        .toThrow('Missing required params');
    });

    it('should query a table with params', async () => {
      mockSend.mockReturnValueOnce({
        LastEvaluatedKey: {
          bar: '2',
        },
        Items: [{
          foo: '1',
          bar: '2',
        }],
      }).mockReturnValueOnce({
        LastEvaluatedKey: {
          bar: '2',
        },
        Items: [{
          foo: '3',
          bar: '4',
        }],
      }).mockReturnValue({
        Items: [{
          foo: '5',
          bar: '6',
        }],
      });

      const client = dynamodb();
      const res = await client.query({ TableName: 'testTable', Items: { foo: '1', bar: '2' } });
      expect(mockSend).toHaveBeenCalledTimes(3);
      expect(res).toEqual([{ foo: '1', bar: '2' }, { foo: '3', bar: '4' }, { foo: '5', bar: '6' }]);
    });
  });

  describe('update', () => {
    it('should throw if you try to update an item without params', async () => {
      const client = dynamodb();
      expect(client.update())
        .rejects
        .toThrow('Missing required params');
    });

    it('should throw if you try to update an item with params', async () => {
      const client = dynamodb();
      await client.update({ TableName: 'testTable', Items: { foo: '1', bar: '2' } });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'testTable',
            Items: { foo: '1', bar: '2' },
          }),
        }),
      );
    });
  });

  describe('unmarshall records', () => {
    it('should throw if you try to unmarshall an item without params', async () => {
      const client = dynamodb();
      expect(() => (client.unmarshallRecords()))
        .toThrow('Missing required records parameter');
    });
  });

  describe('transactwrite', () => {
    it('should throw if you try to update an item without params', async () => {
      const client = dynamodb();
      expect(client.transactWrite())
        .rejects
        .toThrow('Missing required params');
    });

    it('should throw if you try to update an item with params', async () => {
      const client = dynamodb();
      await client.transactWrite({ TableName: 'testTable', Items: { foo: '1', bar: '2' } });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'testTable',
            Items: { foo: '1', bar: '2' },
          }),
        }),
      );
    });
  });

  describe('getUpdateExpression', () => {
    it('should throw if you try to generate without params', async () => {
      const client = dynamodb();
      expect(() => (client.generateUpdateExpression())).toThrow('Missing original and updated parameter');
    });

    it('should call through to generate expression library with params', async () => {
      const client = dynamodb();
      const res = await client.generateUpdateExpression({ foo: '1' }, { foo: '2' });
      expect(res).toEqual({
        ExpressionAttributeNames: {
          '#foo': 'foo',
        },
        ExpressionAttributeValues: {
          ':foo': '2',
        },
        UpdateExpression: 'SET #foo = :foo',
      });
    });
  });
});
