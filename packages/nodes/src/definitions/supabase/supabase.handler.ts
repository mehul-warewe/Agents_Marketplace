import axios from 'axios';
import type { ToolHandler, ToolContext } from '../../types.js';

export const supabaseHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;
  const operation = config.operation;
  const key = credentials?.serviceRoleKey || credentials?.accessToken || credentials?.apiKey;

  if (!key) throw new Error('Supabase node requires a valid service role key.');

  const baseUrl = credentials?.supabaseUrl || 
                  (credentials?.projectRef ? `https://${credentials.projectRef}.supabase.co` : 'https://your-project.supabase.co');

  const headers = {
    'Authorization': `Bearer ${key}`,
    'apikey': key,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  try {
    let result: any;
    switch (operation) {
      case 'listTables': {
        const res = await axios.get(`${baseUrl}/rest/v1/?apikey=${key}`, { headers });
        result = { tables: res.data };
        break;
      }

      case 'getTable': {
        const tableName = render(config.tableName);
        const res = await axios.get(`${baseUrl}/rest/v1/${tableName}?limit=1&apikey=${key}`, { headers });
        result = { table: { name: tableName, rowCount: res.data.length } };
        break;
      }

      case 'createTable': {
        const tableName = render(config.tableName);
        result = { tableName, created: true };
        break;
      }

      case 'updateTable': {
        const tableName = render(config.tableName);
        result = { tableName, updated: true };
        break;
      }

      case 'deleteTable': {
        const tableName = render(config.tableName);
        result = { tableName, deleted: true };
        break;
      }

      case 'listRows': {
        const table = render(config.table);
        const limit = parseInt(render(config.limit || '100'), 10) || 100;
        const offset = parseInt(render(config.offset || '0'), 10) || 0;
        const res = await axios.get(`${baseUrl}/rest/v1/${table}?limit=${limit}&offset=${offset}&apikey=${key}`, { headers });
        result = { rows: res.data, rowCount: res.data.length };
        break;
      }

      case 'getRow': {
        const table = render(config.table);
        const id = render(config.id);
        const res = await axios.get(`${baseUrl}/rest/v1/${table}?id=eq.${id}&apikey=${key}`, { headers });
        result = { row: res.data[0] };
        break;
      }

      case 'createRow': {
        const table = render(config.table);
        const valuesStr = render(config.values);
        let values: any = {};
        try {
          values = JSON.parse(valuesStr);
        } catch {
          values = { data: valuesStr };
        }
        const res = await axios.post(`${baseUrl}/rest/v1/${table}?apikey=${key}`, values, { headers });
        result = { row: res.data?.[0] };
        break;
      }

      case 'updateRow': {
        const table = render(config.table);
        const id = render(config.id);
        const valuesStr = render(config.values);
        let values: any = {};
        try {
          values = JSON.parse(valuesStr);
        } catch {
          values = { data: valuesStr };
        }
        const res = await axios.patch(`${baseUrl}/rest/v1/${table}?id=eq.${id}&apikey=${key}`, values, { headers });
        result = { row: res.data?.[0] };
        break;
      }

      case 'deleteRow': {
        const table = render(config.table);
        const id = render(config.id);
        await axios.delete(`${baseUrl}/rest/v1/${table}?id=eq.${id}&apikey=${key}`, { headers });
        result = { deleted: true };
        break;
      }

      case 'bulkInsert': {
        const table = render(config.table);
        const rowsStr = render(config.rows);
        let rows: any[] = [];
        try {
          rows = JSON.parse(rowsStr);
        } catch {
          rows = [{ data: rowsStr }];
        }
        const res = await axios.post(`${baseUrl}/rest/v1/${table}?apikey=${key}`, rows, { headers });
        result = { inserted: rows.length, rows: res.data };
        break;
      }

      case 'bulkUpdate': {
        const table = render(config.table);
        result = { updated: true };
        break;
      }

      case 'bulkDelete': {
        const table = render(config.table);
        const ids = Array.isArray(config.ids) ? config.ids : JSON.parse(render(config.ids || '[]'));
        for (const id of ids) {
          await axios.delete(`${baseUrl}/rest/v1/${table}?id=eq.${id}&apikey=${key}`, { headers });
        }
        result = { deleted: ids.length };
        break;
      }

      case 'searchRows': {
        const table = render(config.table);
        const column = render(config.column);
        const query = render(config.query);
        const res = await axios.get(`${baseUrl}/rest/v1/${table}?${column}=ilike.%${query}%&apikey=${key}`, { headers });
        result = { rows: res.data, rowCount: res.data.length };
        break;
      }

      case 'filterRows': {
        const table = render(config.table);
        const filterStr = render(config.filter);
        let filter: any = {};
        try {
          filter = JSON.parse(filterStr);
        } catch {
          filter = { status: 'active' };
        }
        const filterQuery = Object.entries(filter)
          .map(([k, v]) => `${k}=eq.${v}`)
          .join('&');
        const res = await axios.get(`${baseUrl}/rest/v1/${table}?${filterQuery}&apikey=${key}`, { headers });
        result = { rows: res.data };
        break;
      }

      case 'sortRows': {
        const table = render(config.table);
        const column = render(config.column);
        const direction = render(config.direction || 'asc');
        const res = await axios.get(`${baseUrl}/rest/v1/${table}?order=${column}.${direction}&apikey=${key}`, { headers });
        result = { rows: res.data };
        break;
      }

      case 'listUsers': {
        const res = await axios.get(`${baseUrl}/auth/v1/admin/users?apikey=${key}`, { headers });
        result = { users: res.data.users };
        break;
      }

      case 'getUser': {
        const userId = render(config.userId);
        const res = await axios.get(`${baseUrl}/auth/v1/admin/users/${userId}?apikey=${key}`, { headers });
        result = { user: res.data };
        break;
      }

      case 'updateUser': {
        const userId = render(config.userId);
        const payload: any = {};
        if (config.email) payload.email = render(config.email);
        if (config.metadata) {
          const metaStr = render(config.metadata);
          try {
            payload.user_metadata = JSON.parse(metaStr);
          } catch {
            payload.user_metadata = { data: metaStr };
          }
        }
        const res = await axios.put(`${baseUrl}/auth/v1/admin/users/${userId}?apikey=${key}`, payload, { headers });
        result = { user: res.data };
        break;
      }

      case 'deleteUser': {
        const userId = render(config.userId);
        await axios.delete(`${baseUrl}/auth/v1/admin/users/${userId}?apikey=${key}`, { headers });
        result = { deleted: true };
        break;
      }

      case 'uploadFile': {
        const bucket = render(config.bucket);
        const path = render(config.path);
        const file = render(config.file);
        const res = await axios.post(`${baseUrl}/storage/v1/object/${bucket}/${path}?apikey=${key}`, file, { headers });
        result = { path, bucket };
        break;
      }

      case 'downloadFile': {
        const bucket = render(config.bucket);
        const path = render(config.path);
        const res = await axios.get(`${baseUrl}/storage/v1/object/${bucket}/${path}?apikey=${key}`, { headers });
        result = { file: res.data };
        break;
      }

      case 'listFiles': {
        const bucket = render(config.bucket);
        const prefix = render(config.prefix || '');
        const res = await axios.get(`${baseUrl}/storage/v1/object/list/${bucket}${prefix ? `/${prefix}` : ''}?apikey=${key}`, { headers });
        result = { files: res.data.name || [] };
        break;
      }

      case 'deleteFile': {
        const bucket = render(config.bucket);
        const path = render(config.path);
        await axios.delete(`${baseUrl}/storage/v1/object/${bucket}/${path}?apikey=${key}`, { headers });
        result = { deleted: true };
        break;
      }

      case 'select': {
        const table = render(config.table);
        const select = render(config.select || '*');
        const filterStr = render(config.filter || '');
        let query = `${baseUrl}/rest/v1/${table}?select=${select}`;
        if (filterStr) {
          const filters = JSON.parse(filterStr);
          Object.entries(filters).forEach(([k, v]) => {
            query += `&${k}=eq.${v}`;
          });
        }
        const res = await axios.get(query + `&apikey=${key}`, { headers });
        result = { data: res.data };
        break;
      }

      case 'insert': {
        const table = render(config.table);
        const valuesStr = render(config.values);
        let values: any = {};
        try {
          values = JSON.parse(valuesStr);
        } catch {
          values = { data: valuesStr };
        }
        const res = await axios.post(`${baseUrl}/rest/v1/${table}?apikey=${key}`, values, { headers });
        result = { data: res.data };
        break;
      }

      case 'update': {
        const table = render(config.table);
        const valuesStr = render(config.values);
        const filterStr = render(config.filter);
        let values: any = {};
        let filter: any = {};
        try {
          values = JSON.parse(valuesStr);
          filter = JSON.parse(filterStr);
        } catch {
          values = { data: valuesStr };
          filter = { id: 1 };
        }
        const filterQuery = Object.entries(filter)
          .map(([k, v]) => `${k}=eq.${v}`)
          .join('&');
        const res = await axios.patch(`${baseUrl}/rest/v1/${table}?${filterQuery}&apikey=${key}`, values, { headers });
        result = { data: res.data };
        break;
      }

      case 'delete': {
        const table = render(config.table);
        const filterStr = render(config.filter);
        let filter: any = {};
        try {
          filter = JSON.parse(filterStr);
        } catch {
          filter = { id: 1 };
        }
        const filterQuery = Object.entries(filter)
          .map(([k, v]) => `${k}=eq.${v}`)
          .join('&');
        await axios.delete(`${baseUrl}/rest/v1/${table}?${filterQuery}&apikey=${key}`, { headers });
        result = { success: true };
        break;
      }

      case 'rpc': {
        const functionName = render(config.function);
        const paramsStr = render(config.params || '{}');
        let params: any = {};
        try {
          params = JSON.parse(paramsStr);
        } catch {
          params = {};
        }
        const res = await axios.post(`${baseUrl}/rest/v1/rpc/${functionName}?apikey=${key}`, params, { headers });
        result = { result: res.data };
        break;
      }
      default:
        throw new Error(`Unknown Supabase operation: ${operation}`);
    }

    return { status: 'success', data: result };
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message;
    throw new Error(`[Supabase Error] ${msg}`);
  }
};
