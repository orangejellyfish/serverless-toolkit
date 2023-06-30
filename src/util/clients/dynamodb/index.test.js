/* eslint-disable global-require */
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import ksuid from 'ksuid';
import dynamoDbClient from '.';

jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('aws-xray-sdk');

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

  it('should allow wrapping of the client with AWS X-Ray', () => {
    let localDynamoDbClient;

    jest.isolateModules(() => {
      localDynamoDbClient = require('.').default;
    });

    // This is a poor assertion which could be improved by mocking the call to
    // `XRay.captureAWSv3Client` and ensuring it's been called with the client
    // instance, but I couldn't figure out how to do that easily.
    expect.anything(localDynamoDbClient({ xray: true }));
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
