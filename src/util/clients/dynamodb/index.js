import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

let client;
let ddbDocClient;

const createClientAndCacheClient = ({ config, translateConfig } = {}) => {
  if (client && ddbDocClient) return ddbDocClient;

  client = new DynamoDBClient({
    region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION,
    ...config ?? {},
  });

  ddbDocClient = DynamoDBDocumentClient.from(client, translateConfig ?? {});

  return ddbDocClient;
};

export * from '@aws-sdk/util-dynamodb';
export * from '@aws-sdk/lib-dynamodb';
export * from 'dynamodb-update-expression';
export default createClientAndCacheClient;
