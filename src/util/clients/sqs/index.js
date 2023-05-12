import { SQSClient } from '@aws-sdk/client-sqs'; // ES Modules import

let client;

const createClientAndCacheClient = ({ config } = {}) => {
  if (client) return client;

  client = new SQSClient({
    region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION,
    ...config ?? {},
  });

  return client;
};

export * from '@aws-sdk/client-sqs';
export default createClientAndCacheClient;
