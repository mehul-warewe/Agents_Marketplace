import axios from 'axios';
import type { ToolHandler, ToolContext } from '../../types.js';

export const notionHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;
  const operation = config.operation;
  const token = credentials?.notionToken || credentials?.accessToken || credentials?.apiKey;

  if (!token) throw new Error('Notion node requires a valid integration token.');

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };

  const baseUrl = 'https://api.notion.com/v1';

  try {
    let result: any;
    switch (operation) {
      case 'listDatabases': {
        const res = await axios.post(`${baseUrl}/search`, {
          filter: { property: 'object', value: 'database' }
        }, { headers });
        result = res.data.results;
        break;
      }

      case 'getDatabase': {
        const databaseId = render(config.databaseId);
        const res = await axios.get(`${baseUrl}/databases/${databaseId}`, { headers });
        result = res.data;
        break;
      }

      case 'createDatabase': {
        const parentId = render(config.parentId);
        const title = render(config.title);
        const res = await axios.post(`${baseUrl}/databases`, {
          parent: { page_id: parentId },
          title: [{ text: { content: title } }],
          properties: { Name: { title: {} } }
        }, { headers });
        result = res.data;
        break;
      }

      case 'updateDatabase': {
        const databaseId = render(config.databaseId);
        const title = render(config.title);
        const res = await axios.patch(`${baseUrl}/databases/${databaseId}`, {
          title: [{ text: { content: title } }]
        }, { headers });
        result = res.data;
        break;
      }

      case 'listPages': {
        const res = await axios.post(`${baseUrl}/search`, {
          filter: { property: 'object', value: 'page' }
        }, { headers });
        result = res.data.results;
        break;
      }

      case 'getPage': {
        const pageId = render(config.pageId);
        const res = await axios.get(`${baseUrl}/pages/${pageId}`, { headers });
        result = res.data;
        break;
      }

      case 'createPage': {
        const parentId = render(config.parentId);
        const title = render(config.title);
        const propertiesStr = render(config.properties || '{}');
        let properties: any = {};
        try {
          properties = JSON.parse(propertiesStr);
        } catch {
          properties = {};
        }

        // Logic to detect if parent is a database or page
        // For simplicity, we assume if it's long uuid it might be a database if used with properties
        const isDatabase = parentId.length > 20 && Object.keys(properties).length > 0;
        
        const body: any = {
          parent: isDatabase ? { database_id: parentId } : { page_id: parentId },
          properties: {
            title: isDatabase ? undefined : [{ text: { content: title } }],
            ...properties
          }
        };

        // If it's a database page, the title property name might vary (usually 'Name' or 'title')
        if (isDatabase) {
           // We try to find a title-type property or fallback to 'Name'
           const titleKey = Object.keys(properties).find(k => properties[k].title) || 'Name';
           body.properties[titleKey] = { title: [{ text: { content: title } }] };
        }

        const res = await axios.post(`${baseUrl}/pages`, body, { headers });
        result = res.data;
        break;
      }

      case 'updatePage': {
        const pageId = render(config.pageId);
        const propertiesStr = render(config.properties || '{}');
        let properties: any = {};
        try {
          properties = JSON.parse(propertiesStr);
        } catch {
          properties = {};
        }
        const res = await axios.patch(`${baseUrl}/pages/${pageId}`, { properties }, { headers });
        result = res.data;
        break;
      }

      case 'archivePage': {
        const pageId = render(config.pageId);
        const res = await axios.patch(`${baseUrl}/pages/${pageId}`, { archived: true }, { headers });
        result = res.data;
        break;
      }

      case 'listBlocks': {
        const blockId = render(config.pageId || config.blockId);
        const res = await axios.get(`${baseUrl}/blocks/${blockId}/children`, { headers });
        result = res.data.results;
        break;
      }

      case 'appendBlock': {
        const blockId = render(config.pageId || config.blockId);
        const type = render(config.type || 'paragraph');
        const content = render(config.content);
        const res = await axios.patch(`${baseUrl}/blocks/${blockId}/children`, {
          children: [{
            object: 'block',
            type,
            [type]: { rich_text: [{ text: { content } }] }
          }]
        }, { headers });
        result = res.data;
        break;
      }

      case 'search': {
        const query = render(config.query);
        const res = await axios.post(`${baseUrl}/search`, { query }, { headers });
        result = res.data.results;
        break;
      }

      case 'filterDatabase': {
        const databaseId = render(config.databaseId);
        const filterStr = render(config.filter || '{}');
        let filter = {};
        try { filter = JSON.parse(filterStr); } catch { filter = {}; }
        const res = await axios.post(`${baseUrl}/databases/${databaseId}/query`, { filter }, { headers });
        result = res.data.results;
        break;
      }

      default:
        throw new Error(`Unknown Notion operation: ${operation}`);
    }

    return { status: 'success', data: result };
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message;
    throw new Error(`[Notion Error] ${msg}`);
  }
};
