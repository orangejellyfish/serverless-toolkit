import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import createClientAndCacheClient, {
  getUpdateExpression,
  BatchGetItemCommand,
  BatchWriteItemCommand,
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  TransactWriteItemsCommand,
  UpdateItemCommand,
  unmarshall,
} from '../util/clients/dynamodb';

export default function createClient() {
  const db = createClientAndCacheClient();

  return {
    // Insert a new item into the database.
    put: async function put(params) {
      if (!params) {
        throw new Error('Missing required params');
      }

      const putCommand = new PutItemCommand(params);

      return db.send(putCommand);
    },

    // Retrieve a single item by key.
    get: async function get(params) {
      if (!params) {
        throw new Error('Missing required params');
      }

      const getCommand = new GetItemCommand(params);
      const res = await db.send(getCommand);

      if (!res || !res.Item) {
        return null;
      }

      return res.Item;
    },

    // Retrieve multiple items.
    batchGet: async function batchGet(table, keys, params) {
      if (!table) {
        throw new Error('Missing required table parameter');
      }

      if (!keys) {
        throw new Error('Missing required keys parameter');
      }

      if (!params) {
        throw new Error('Missing required params parameter');
      }

      const MAX_KEYS_PER_BATCH_REQUEST = 100;
      const remaining = [...keys];
      const items = [];

      while (remaining.length) {
        // @TODO we should implement some sort of back-off mechanism to better handle if this is a
        // throttling issue.

        // @TODO handle unprocessed items better right now it infinite loops.

        const Keys = remaining.splice(0, MAX_KEYS_PER_BATCH_REQUEST);

        const res = await db
          .send(new BatchGetItemCommand({
            RequestItems: {
              [table]: { Keys, ...params },
            },
          }));

        items.push(...res.Responses[table]);

        const unprocessed = res?.UnprocessedKeys?.[table]?.Keys;

        if (unprocessed) {
          remaining.unshift(...unprocessed);
        }
      }

      return items;
    },

    // Create or update multiple items.
    batchWrite: async function batchWrite(table, items) {
      if (!table) {
        throw new Error('Missing required table parameter');
      }

      if (!items) {
        throw new Error('Missing required items parameter');
      }

      const MAX_ITEMS_PER_BATCH = 25;
      const numBatches = Math.ceil(items.length / MAX_ITEMS_PER_BATCH);

      const batches = [...Array(numBatches)].map((_, i) => {
        const start = i * MAX_ITEMS_PER_BATCH;
        const end = start + MAX_ITEMS_PER_BATCH;
        const batchItems = items
          .slice(start, end)
          .map((Item) => ({ PutRequest: { Item } }));
        return { [table]: batchItems };
      });

      while (batches.length) {
        const params = { RequestItems: batches.pop() };
        const res = await db.send(new BatchWriteItemCommand(params));
        if (Object.keys(res.UnprocessedItems).length) {
          batches.push(res.UnprocessedItems);
        }
      }
    },

    // Update a single item by key.
    update: async function update(params) {
      if (!params) {
        throw new Error('Missing required params parameter');
      }

      const updateCommand = new UpdateItemCommand(params);
      return db.send(updateCommand);
    },

    // Delete items.
    delete: async function del(params) {
      if (!params) {
        throw new Error('Missing required params parameter');
      }

      const deleteCommand = new DeleteItemCommand(params);
      return db.send(deleteCommand);
    },

    // Scan the table.
    scan: async function scan(params) {
      if (!params) {
        throw new Error('Missing required params parameter');
      }

      const items = [];
      let res;

      do {
        res = await db.send(
          new ScanCommand({ ...params, ExclusiveStartKey: res?.LastEvaluatedKey }),
        );
        items.push(...res.Items);
      } while (res.LastEvaluatedKey);

      return items;
    },

    // Query a table on primary key or secondary index.
    query: async function query(params) {
      if (!params) {
        throw new Error('Missing required params parameter');
      }
      const items = [];
      let res;

      do {
        res = await db.send(
          new QueryCommand({ ...params, ExclusiveStartKey: res?.LastEvaluatedKey }),
        );
        items.push(...res.Items);
      } while (res.LastEvaluatedKey);

      return items;
    },

    // Utility function to generate DynamoDB update expressions.
    generateUpdateExpression: function generateUpdateExpression(original, updated, opts) {
      if (!original || !updated) {
        throw new Error('Missing original and updated parameter');
      }
      return getUpdateExpression(original, updated, opts);
    },

    // Utility function to unmarshall records from a DynamoDB stream.
    unmarshallRecords: function unmarshallRecords(records, key = 'NewImage') {
      if (!records) {
        throw new Error('Missing required records parameter');
      }

      const unmarshalledRecords = records.map((record) => {
        const image = record?.dynamodb?.[key];

        return unmarshall(image);
      });

      return unmarshalledRecords;
    },

    transactWrite: async function transactWrite(params) {
      if (!params) {
        throw new Error('Missing required params parameter');
      }

      return db.send(new TransactWriteItemsCommand(params));
    },
  };
}
