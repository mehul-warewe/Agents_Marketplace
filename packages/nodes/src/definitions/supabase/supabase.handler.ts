import axios from 'axios';
import type { ToolHandler, ToolContext } from '../../types.js';

export const supabaseHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;
  const operation = config.operation;
  
  const key = credentials?.serviceRoleKey;
  const rawBaseUrl = credentials?.supabaseUrl;

  if (!key || !rawBaseUrl) {
    throw new Error('Supabase node requires a valid Supabase URL and Service Role Key in credentials.');
  }

  // Ensure baseUrl doesn't have trailing slash
  const baseUrl = rawBaseUrl.replace(/\/$/, '');

  const headers = {
    'Authorization': `Bearer ${key}`,
    'apikey': key,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  try {
    let result: any;
    
    // Helper for JSON parsing
    const safeParse = (val: any, defaultVal: any = {}) => {
      if (!val) return defaultVal;
      if (typeof val !== 'string') return val;
      try {
        return JSON.parse(val);
      } catch {
        return defaultVal;
      }
    };

    switch (operation) {
      case 'listTables': {
        // PostgREST root returns OpenAPI spec which contains the schema
        const res = await axios.get(`${baseUrl}/rest/v1/`, { headers });
        const definitions = res.data.definitions || {};
        const tables = Object.keys(definitions).map(name => ({
          name,
          schema: definitions[name]
        }));
        result = { tables, count: tables.length };
        break;
      }

      case 'getTable': {
        const tableName = render(config.tableName || config.table);
        const res = await axios.get(`${baseUrl}/rest/v1/`, { headers });
        const definition = res.data.definitions?.[tableName];
        if (!definition) throw new Error(`Table "${tableName}" not found in schema.`);
        result = { table: tableName, schema: definition };
        break;
      }

      case 'createTable':
      case 'updateTable':
      case 'deleteTable': {
        throw new Error(`Operation "${operation}" is not supported via the REST API. Please use the Supabase SQL editor or Management API.`);
      }

      case 'listRows': {
        const table = render(config.table);
        const limit = parseInt(render(config.limit || '100'), 10) || 100;
        const offset = parseInt(render(config.offset || '0'), 10) || 0;
        const res = await axios.get(`${baseUrl}/rest/v1/${table}`, { 
          headers,
          params: { limit, offset }
        });
        result = { rows: res.data, count: res.data.length };
        break;
      }

      case 'getRow': {
        const table = render(config.table);
        const id = render(config.id);
        const res = await axios.get(`${baseUrl}/rest/v1/${table}`, { 
          headers,
          params: { id: `eq.${id}` }
        });
        result = { row: res.data[0] || null };
        break;
      }

      case 'createRow': {
        const table = render(config.table);
        const values = safeParse(render(config.values));
        const res = await axios.post(`${baseUrl}/rest/v1/${table}`, values, { headers });
        result = { row: res.data?.[0], data: res.data };
        break;
      }

      case 'updateRow': {
        const table = render(config.table);
        const id = render(config.id);
        const values = safeParse(render(config.values));
        const res = await axios.patch(`${baseUrl}/rest/v1/${table}`, values, { 
          headers,
          params: { id: `eq.${id}` }
        });
        result = { row: res.data?.[0], data: res.data };
        break;
      }

      case 'deleteRow': {
        const table = render(config.table);
        const id = render(config.id);
        await axios.delete(`${baseUrl}/rest/v1/${table}`, { 
          headers,
          params: { id: `eq.${id}` }
        });
        result = { success: true, id };
        break;
      }

      case 'bulkInsert': {
        const table = render(config.table);
        const rows = safeParse(render(config.rows || config.values), []);
        const res = await axios.post(`${baseUrl}/rest/v1/${table}`, rows, { headers });
        result = { count: res.data?.length || 0, rows: res.data };
        break;
      }

      case 'bulkUpdate': {
        // Bulk update in PostgREST is: PATCH /table?id=in.(1,2,3) with one set of values
        // If they want different values for different rows, we'd need a loop or some clever SQL.
        // But the common "bulk update" in these tools is usually "update these rows with these same values" 
        // OR an array of primary keys.
        const table = render(config.table);
        const updates = safeParse(render(config.updates));
        // Expecting updates: { where: { id: [1,2,3] }, set: { ... } }
        const filter = updates.where || {};
        const values = updates.set || {};
        
        let params: any = {};
        Object.entries(filter).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            params[k] = `in.(${v.join(',')})`;
          } else {
            params[k] = `eq.${v}`;
          }
        });

        const res = await axios.patch(`${baseUrl}/rest/v1/${table}`, values, { headers, params });
        result = { count: res.data?.length || 0, data: res.data };
        break;
      }

      case 'bulkDelete': {
        const table = render(config.table);
        const ids = safeParse(render(config.ids), []);
        if (ids.length === 0) {
          result = { count: 0, message: 'No IDs provided' };
        } else {
          await axios.delete(`${baseUrl}/rest/v1/${table}`, { 
            headers,
            params: { id: `in.(${ids.join(',')})` }
          });
          result = { count: ids.length, success: true };
        }
        break;
      }

      case 'searchRows': {
        const table = render(config.table);
        const column = render(config.column);
        const query = render(config.query);
        const res = await axios.get(`${baseUrl}/rest/v1/${table}`, { 
          headers,
          params: { [column]: `ilike.%${query}%` }
        });
        result = { rows: res.data, count: res.data.length };
        break;
      }

      case 'filterRows': {
        const table = render(config.table);
        const filter = safeParse(render(config.filter));
        let params: any = {};
        Object.entries(filter).forEach(([k, v]) => {
          params[k] = `eq.${v}`;
        });
        const res = await axios.get(`${baseUrl}/rest/v1/${table}`, { headers, params });
        result = { rows: res.data, count: res.data.length };
        break;
      }

      case 'sortRows': {
        const table = render(config.table);
        const column = render(config.column);
        const direction = render(config.direction || 'asc');
        const res = await axios.get(`${baseUrl}/rest/v1/${table}`, { 
          headers,
          params: { order: `${column}.${direction}` }
        });
        result = { rows: res.data, count: res.data.length };
        break;
      }

      case 'listUsers': {
        const res = await axios.get(`${baseUrl}/auth/v1/admin/users`, { headers });
        result = { users: res.data.users, count: res.data.users?.length || 0 };
        break;
      }

      case 'getUser': {
        const userId = render(config.userId);
        const res = await axios.get(`${baseUrl}/auth/v1/admin/users/${userId}`, { headers });
        result = { user: res.data };
        break;
      }

      case 'updateUser': {
        const userId = render(config.userId);
        const payload: any = {};
        if (config.email) payload.email = render(config.email);
        if (config.metadata) {
          payload.user_metadata = safeParse(render(config.metadata));
        }
        const res = await axios.put(`${baseUrl}/auth/v1/admin/users/${userId}`, payload, { headers });
        result = { user: res.data };
        break;
      }

      case 'deleteUser': {
        const userId = render(config.userId);
        await axios.delete(`${baseUrl}/auth/v1/admin/users/${userId}`, { headers });
        result = { success: true };
        break;
      }

      case 'uploadFile': {
        const bucket = render(config.bucket);
        const path = render(config.path);
        const fileContent = render(config.file);
        // Supabase storage expects the file in the body. 
        // If it's a URL, we might need more logic, but for simple agents, it might be raw data.
        const res = await axios.post(`${baseUrl}/storage/v1/object/${bucket}/${path}`, fileContent, { 
          headers: {
            ...headers,
            'Content-Type': 'application/octet-stream' // generic binary
          }
        });
        result = { path, bucket, data: res.data };
        break;
      }

      case 'downloadFile': {
        const bucket = render(config.bucket);
        const path = render(config.path);
        const res = await axios.get(`${baseUrl}/storage/v1/object/${bucket}/${path}`, { 
          headers,
          responseType: 'arraybuffer'
        });
        result = { file: res.data.toString('base64'), size: res.data.length };
        break;
      }

      case 'listFiles': {
        const bucket = render(config.bucket);
        const prefix = render(config.prefix || '');
        const res = await axios.post(`${baseUrl}/storage/v1/object/list/${bucket}`, { prefix }, { headers });
        result = { files: res.data, count: res.data.length };
        break;
      }

      case 'deleteFile': {
        const bucket = render(config.bucket);
        const path = render(config.path);
        await axios.delete(`${baseUrl}/storage/v1/object/${bucket}/${path}`, { headers });
        result = { success: true };
        break;
      }

      case 'select': {
        const table = render(config.table);
        const select = render(config.select || '*');
        const filter = safeParse(render(config.filter || '{}'));
        let params: any = { select };
        Object.entries(filter).forEach(([k, v]) => {
          params[k] = `eq.${v}`;
        });
        const res = await axios.get(`${baseUrl}/rest/v1/${table}`, { headers, params });
        result = { data: res.data, count: res.data.length };
        break;
      }

      case 'insert': {
        const table = render(config.table);
        const values = safeParse(render(config.values));
        const res = await axios.post(`${baseUrl}/rest/v1/${table}`, values, { headers });
        result = { data: res.data, count: res.data?.length || 0 };
        break;
      }

      case 'update': {
        const table = render(config.table);
        const values = safeParse(render(config.values));
        const filter = safeParse(render(config.filter));
        let params: any = {};
        Object.entries(filter).forEach(([k, v]) => {
          params[k] = `eq.${v}`;
        });
        const res = await axios.patch(`${baseUrl}/rest/v1/${table}`, values, { headers, params });
        result = { data: res.data, count: res.data?.length || 0 };
        break;
      }

      case 'delete': {
        const table = render(config.table);
        const filter = safeParse(render(config.filter));
        let params: any = {};
        Object.entries(filter).forEach(([k, v]) => {
          params[k] = `eq.${v}`;
        });
        await axios.delete(`${baseUrl}/rest/v1/${table}`, { headers, params });
        result = { success: true };
        break;
      }

      case 'rpc': {
        const functionName = render(config.function);
        const params = safeParse(render(config.params || '{}'));
        const res = await axios.post(`${baseUrl}/rest/v1/rpc/${functionName}`, params, { headers });
        result = { data: res.data };
        break;
      }
      default:
        throw new Error(`Unknown Supabase operation: ${operation}`);
    }

    return { status: 'success', data: result };
  } catch (err: any) {
    const errorData = err.response?.data;
    const msg = errorData?.message || errorData?.error_description || err.message;
    const details = errorData?.details || '';
    throw new Error(`[Supabase Error] ${msg}${details ? `: ${details}` : ''}`);
  }
};
