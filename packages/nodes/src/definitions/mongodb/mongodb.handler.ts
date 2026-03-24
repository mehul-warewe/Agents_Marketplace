import type { ToolHandler, ToolContext } from '../../types.js';
import { getConnectedMongoClient } from '../../utils/db-clients.js';

const parseJson = (str: string, render: any) => {
  try { return JSON.parse(render(str || '{}')); }
  catch { return {}; }
};

export const mongodbAtlasHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, credentials, render } = ctx;
  const { operation, collection, document, query } = config;
  const { connectionString, database } = credentials || {};
  if (!connectionString) throw new Error('MongoDB Connection String is required.');
  const client = await getConnectedMongoClient(connectionString);
  const db = client.db(database);
  const coll = db.collection(collection || 'default');

  switch (operation) {
    case 'insertOne': return await coll.insertOne(parseJson(document, render));
    case 'findOne':   return await coll.findOne(parseJson(document, render));
    case 'findMany':  return await coll.find(parseJson(query, render)).toArray();
    case 'updateOne': return await coll.updateOne(parseJson(query, render), { $set: parseJson(document, render) });
    case 'deleteOne': return await coll.deleteOne(parseJson(document, render));
    default: throw new Error(`Unknown MongoDB operation: ${operation}`);
  }
};
