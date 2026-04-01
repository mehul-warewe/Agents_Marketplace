import type { ToolHandler, ToolContext } from '../../types.js';
import { getConnectedRedisClient } from '../../utils/db-clients.js';

const parseJson = (str: string, render: any) => {
  try { return JSON.parse(render(str || '{}')); }
  catch { return {}; }
};

export const redisHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, credentials, render } = ctx;
  const { operation, key, value, ttl } = config;
  const { url } = credentials || {};
  if (!url) throw new Error('Redis URL is required.');
  const client = await getConnectedRedisClient(url);
  const finalKey = render(key || `history:{{userId}}`);
  const finalVal = value ? render(value) : '';

  try {
    let result: any;
    switch (operation) {
      case 'get':  result = await client.get(finalKey); break;
      case 'set': 
        if (ttl) result = await client.set(finalKey, finalVal, 'EX', parseInt(render(ttl)));
        else result = await client.set(finalKey, finalVal);
        break;
      case 'del':  result = await client.del(finalKey); break;
      case 'hset': result = await client.hset(finalKey, parseJson(value, render)); break;
      default: throw new Error(`Unknown Redis operation: ${operation}`);
    }
    return { status: 'success', data: result };
  } catch (err: any) {
    throw new Error(`[Redis Error] ${err.message}`);
  }
};
