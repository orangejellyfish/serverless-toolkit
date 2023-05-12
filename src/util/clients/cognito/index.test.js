/* eslint-disable global-require */
import { CognitoIdentityProviderClient }
  from '@aws-sdk/client-cognito-identity-provider';

import ksuid from 'ksuid';
import cognitoClient from '.';

jest.mock('@aws-sdk/client-cognito-identity-provider');

describe('common / utils / cognito', () => {
  beforeEach(() => {
    CognitoIdentityProviderClient.mockImplementation((config) => config);
  });

  afterEach(() => {
    delete process.env.AWS_DEFAULT_REGION;
    delete process.env.AWS_REGION;

    jest.clearAllMocks();
  });

  it('should initialise without a config', () => {
    expect.anything(cognitoClient());
  });

  it('should create and cache client', () => {
    const mockProp = ksuid.randomSync();
    const client1 = cognitoClient({
      config: {
        mockPropA: mockProp,
      },
    });
    const client2 = cognitoClient({
      config: {
        mockPropA: ksuid.randomSync(),
      },
    });

    expect(client2).toMatchObject(client1);
  });

  it('should set region from env var AWS_REGION', () => {
    process.env.AWS_REGION = 'mock-aws-region-1';

    let localCognitoClient;

    jest.isolateModules(() => {
      localCognitoClient = require('.').default;
    });

    const client = localCognitoClient({});

    expect(client.region).toEqual('mock-aws-region-1');
  });

  it('should set region from env var AWS_DEFAULT_REGION as alternative', () => {
    process.env.AWS_DEFAULT_REGION = 'mock-aws-region-2';

    let localCognitoClient;

    jest.isolateModules(() => {
      localCognitoClient = require('.').default;
    });

    const client = localCognitoClient({});

    expect(client.region).toEqual('mock-aws-region-2');
  });
});
