import { CognitoIdentityProviderClient }
  from '@aws-sdk/client-cognito-identity-provider';

let client;

const createClientAndCacheClient = ({ config } = {}) => {
  if (client) return client;

  client = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION,
    ...config ?? {},
  });

  return client;
};

export * from '@aws-sdk/client-cognito-identity-provider';

export default createClientAndCacheClient;
