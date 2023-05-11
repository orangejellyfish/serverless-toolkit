/* eslint-disable global-require */
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import ksuid from 'ksuid';
import dynamoDbClient from '.';

jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

describe('common / utils / dynamodb', () => {
  beforeEach(() => {
    DynamoDBClient.mockImplementation((config) => config);
    DynamoDBDocumentClient.from.mockImplementation((client, translateConfig) => ({
      ...client,
      ...translateConfig ?? {},
    }));
  });

  afterEach(() => {
    delete process.env.AWS_DEFAULT_REGION;
    delete process.env.AWS_REGION;

    jest.clearAllMocks();
  });

  it('should initialise without a config', () => {
    expect.anything(dynamoDbClient());
  });

  it('should create and cache client', () => {
    const mockProp = ksuid.randomSync();
    const client1 = dynamoDbClient({
      config: {
        mockPropA: mockProp,
      },
      translateConfig: {
        mockPropB: mockProp,
      },
    });
    const client2 = dynamoDbClient({
      config: {
        mockPropA: ksuid.randomSync(),
      },
      translateConfig: {
        mockPropA: ksuid.randomSync(),
      },
    });

    expect(client2).toMatchObject(client1);
  });

  it('should set region from env var AWS_REGION', () => {
    process.env.AWS_REGION = 'mock-aws-region-1';

    let localDynamoDbClient;

    jest.isolateModules(() => {
      localDynamoDbClient = require('.').default;
    });

    const client = localDynamoDbClient({});

    expect(client.region).toEqual('mock-aws-region-1');
  });

  it('should set region from env var AWS_DEFAULT_REGION as alternative', () => {
    process.env.AWS_DEFAULT_REGION = 'mock-aws-region-2';

    let localDynamoDbClient;

    jest.isolateModules(() => {
      localDynamoDbClient = require('.').default;
    });

    const client = localDynamoDbClient({});

    expect(client.region).toEqual('mock-aws-region-2');
  });
});
