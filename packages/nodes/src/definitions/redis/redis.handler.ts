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

  switch (operation) {
    case 'get':  return await client.get(finalKey);
    case 'set': 
      if (ttl) return await client.set(finalKey, finalVal, 'EX', parseInt(render(ttl)));
      return await client.set(finalKey, finalVal);
    case 'del':  return await client.del(finalKey);
    case 'hset': return await client.hset(finalKey, parseJson(value, render));
    default: throw new Error(`Unknown Redis operation: ${operation}`);
  }
};
