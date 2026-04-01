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
  try {
    let result: any;
    switch (operation) {
      case 'insertOne': result = await coll.insertOne(parseJson(document, render)); break;
      case 'findOne':   result = await coll.findOne(parseJson(document, render)); break;
      case 'findMany':  result = await coll.find(parseJson(query, render)).toArray(); break;
      case 'updateOne': result = await coll.updateOne(parseJson(query, render), { $set: parseJson(document, render) }); break;
      case 'deleteOne': result = await coll.deleteOne(parseJson(document, render)); break;
      case 'count':     result = { count: await coll.countDocuments(parseJson(query, render)) }; break;
      default: throw new Error(`Unknown MongoDB operation: ${operation}`);
    }
    return { status: 'success', data: result };
  } catch (err: any) {
    throw new Error(`[MongoDB Error] ${err.message}`);
  }
};
