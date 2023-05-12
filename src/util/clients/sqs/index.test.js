/* eslint-disable global-require */
import { SQSClient }
  from '@aws-sdk/client-sqs';

import ksuid from 'ksuid';
import sqsClient from '.';

jest.mock('@aws-sdk/client-sqs');

describe('common / utils / cognito', () => {
  beforeEach(() => {
    SQSClient.mockImplementation((config) => config);
  });

  afterEach(() => {
    delete process.env.AWS_DEFAULT_REGION;
    delete process.env.AWS_REGION;

    jest.clearAllMocks();
  });

  it('should initialise without a config', () => {
    expect.anything(sqsClient());
  });

  it('should create and cache client', () => {
    const mockProp = ksuid.randomSync();
    const client1 = sqsClient({
      config: {
        mockPropA: mockProp,
      },
    });
    const client2 = sqsClient({
      config: {
        mockPropA: ksuid.randomSync(),
      },
    });

    expect(client2).toMatchObject(client1);
  });

  it('should set region from env var AWS_REGION', () => {
    process.env.AWS_REGION = 'mock-aws-region-1';

    let localSqsClient;

    jest.isolateModules(() => {
      localSqsClient = require('.').default;
    });

    const client = localSqsClient({});

    expect(client.region).toEqual('mock-aws-region-1');
  });

  it('should set region from env var AWS_DEFAULT_REGION as alternative', () => {
    process.env.AWS_DEFAULT_REGION = 'mock-aws-region-2';

    let localSqsClient;

    jest.isolateModules(() => {
      localSqsClient = require('.').default;
    });

    const client = localSqsClient({});

    expect(client.region).toEqual('mock-aws-region-2');
  });
});
