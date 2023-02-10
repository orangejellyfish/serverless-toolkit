import AWS, { DynamoDB } from 'aws-sdk';
import expressions from 'dynamodb-update-expression';

export default function createClient(documentClient) {
  const db = documentClient || new AWS.DynamoDB.DocumentClient();

  return {
    // Insert a new item into the database.
    put: async function put(params = {}) {
      return db.put(params).promise();
    },

    // Retrieve a single item by key.
    get: async function get(params) {
      const res = await db.get(params).promise();

      if (!res || !res.Item) {
        return null;
      }

      return res.Item;
    },

    // Retrieve multiple items.
    batchGet: async function batchGet(table, keys, params = {}) {
      const MAX_KEYS_PER_BATCH_REQUEST = 100;
      const remaining = [...keys];
      const items = [];

      while (remaining.length) {
        const Keys = remaining.splice(0, MAX_KEYS_PER_BATCH_REQUEST);

        const res = await db
          .batchGet({
            RequestItems: {
              [table]: { Keys, ...params },
            },
          })
          .promise();

        items.push(...res.Responses[table]);

        const unprocessed = res.UnprocessedKeys[table]?.Keys;

        if (unprocessed) {
          remaining.unshift(...unprocessed);
        }
      }

      return items;
    },

    // Create or update multiple items.
    batchWrite: async function batchWrite(table, items) {
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
        const res = await db.batchWrite(params).promise();

        if (Object.keys(res.UnprocessedItems).length) {
          batches.push(res.UnprocessedItems);
        }
      }
    },

    // Update a single item by key.
    update: async function update(params) {
      return db.update(params).promise();
    },

    // Delete items.
    delete: async function del(params) {
      const res = await db.delete(params).promise();

      return res;
    },

    // Scan the table.
    scan: async function scan(params) {
      const items = [];
      let res;

      do {
        res = await db.scan({ ...params, ExclusiveStartKey: res?.LastEvaluatedKey }).promise();
        items.push(...res.Items);
      } while (res.LastEvaluatedKey);

      return items;
    },

    // Query a table on primary key or secondary index.
    query: async function query(params) {
      const items = [];
      let res;

      do {
        res = await db.query({ ...params, ExclusiveStartKey: res?.LastEvaluatedKey }).promise();
        items.push(...res.Items);
      } while (res.LastEvaluatedKey);

      return items;
    },

    // Utility function to generate DynamoDB update expressions.
    generateUpdateExpression: function generateUpdateExpression(original, updated, opts) {
      return expressions.getUpdateExpression(original, updated, opts);
    },

    // Utility function to unmarshall records from a DynamoDB stream.
    unmarshallRecords: function unmarshallRecords(records, key = 'NewImage') {
      const unmarshalledRecords = records.map((record) => {
        const image = record?.dynamodb?.[key];

        return DynamoDB.Converter.unmarshall(image);
      });

      return unmarshalledRecords;
    },

    transactWrite: async function transactWrite(params) {
      const res = await db.transactWrite(params).promise();

      return res;
    },
  };
}
