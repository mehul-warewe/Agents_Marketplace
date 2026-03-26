import axios from 'axios';
import type { ToolHandler, ToolContext } from '../../types.js';

export const notionHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;
  const operation = config.operation;
  const token = credentials?.integrationToken;

  if (!token) throw new Error('Notion node requires a valid integration token.');

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };

  const baseUrl = 'https://api.notion.com/v1';

  try {
    switch (operation) {
      case 'listDatabases': {
        const res = await axios.get(`${baseUrl}/search`, {
          params: { filter: { value: 'database', property: 'object' } },
          headers,
        });
        return { success: true, databases: res.data.results };
      }

      case 'getDatabase': {
        const databaseId = render(config.databaseId);
        const res = await axios.get(`${baseUrl}/databases/${databaseId}`, { headers });
        return { success: true, database: res.data };
      }

      case 'createDatabase': {
        const title = render(config.title);
        const parentId = render(config.parentId);
        const payload: any = {
          parent: parentId ? { page_id: parentId } : { type: 'workspace' },
          title: [{ text: { content: title } }],
          properties: { Name: { title: {} } },
        };
        const res = await axios.post(`${baseUrl}/databases`, payload, { headers });
        return { success: true, database: res.data };
      }

      case 'updateDatabase': {
        const databaseId = render(config.databaseId);
        const title = render(config.title || '');
        const payload: any = {};
        if (title) payload.title = [{ text: { content: title } }];
        const res = await axios.patch(`${baseUrl}/databases/${databaseId}`, payload, { headers });
        return { success: true, database: res.data };
      }

      case 'listPages': {
        const parentId = render(config.parentId || '');
        const filter = parentId ? { value: 'page', property: 'object' } : undefined;
        const res = await axios.get(`${baseUrl}/search`, {
          params: filter ? { filter } : {},
          headers,
        });
        return { success: true, pages: res.data.results };
      }

      case 'getPage': {
        const pageId = render(config.pageId);
        const res = await axios.get(`${baseUrl}/pages/${pageId}`, { headers });
        return { success: true, page: res.data };
      }

      case 'createPage': {
        const parentId = render(config.parentId);
        const title = render(config.title);
        const propertiesStr = render(config.properties || '{}');
        let properties: any = {};
        try {
          properties = JSON.parse(propertiesStr);
        } catch {
          properties = { Title: { title: [{ text: { content: title } }] } };
        }

        const payload: any = {
          parent: { page_id: parentId },
          properties: {
            title: [{ text: { content: title } }],
            ...properties,
          },
        };
        const res = await axios.post(`${baseUrl}/pages`, payload, { headers });
        return { success: true, page: res.data };
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

        if (config.title) {
          properties.title = [{ text: { content: render(config.title) } }];
        }

        const payload = { properties };
        const res = await axios.patch(`${baseUrl}/pages/${pageId}`, payload, { headers });
        return { success: true, page: res.data };
      }

      case 'deletePage': {
        const pageId = render(config.pageId);
        const payload = { archived: true };
        const res = await axios.patch(`${baseUrl}/pages/${pageId}`, payload, { headers });
        return { success: true, pageId, archived: true };
      }

      case 'archivePage': {
        const pageId = render(config.pageId);
        const payload = { archived: true };
        const res = await axios.patch(`${baseUrl}/pages/${pageId}`, payload, { headers });
        return { success: true, pageId, archived: true };
      }

      case 'listBlocks': {
        const pageId = render(config.pageId);
        const res = await axios.get(`${baseUrl}/blocks/${pageId}/children`, { headers });
        return { success: true, blocks: res.data.results };
      }

      case 'getBlock': {
        const blockId = render(config.blockId);
        const res = await axios.get(`${baseUrl}/blocks/${blockId}`, { headers });
        return { success: true, block: res.data };
      }

      case 'createBlock': {
        const pageId = render(config.pageId);
        const type = render(config.type);
        const content = render(config.content);

        const blockData: any = {
          object: 'block',
          type,
        };

        if (type === 'paragraph') {
          blockData.paragraph = { text: [{ type: 'text', text: { content } }] };
        } else if (type === 'heading_1' || type === 'heading_2' || type === 'heading_3') {
          blockData[type] = { text: [{ type: 'text', text: { content } }] };
        }

        const payload = { children: [blockData] };
        const res = await axios.patch(`${baseUrl}/blocks/${pageId}/children`, payload, { headers });
        return { success: true, block: res.data.results?.[0] };
      }

      case 'updateBlock': {
        const blockId = render(config.blockId);
        const content = render(config.content);

        const payload: any = {
          paragraph: { text: [{ type: 'text', text: { content } }] },
        };
        const res = await axios.patch(`${baseUrl}/blocks/${blockId}`, payload, { headers });
        return { success: true, block: res.data };
      }

      case 'deleteBlock': {
        const blockId = render(config.blockId);
        const payload = { archived: true };
        const res = await axios.patch(`${baseUrl}/blocks/${blockId}`, payload, { headers });
        return { success: true, blockId, archived: true };
      }

      case 'appendBlock': {
        const pageId = render(config.pageId);
        const type = render(config.type);
        const content = render(config.content);

        const blockData: any = {
          object: 'block',
          type,
        };

        if (type === 'paragraph') {
          blockData.paragraph = { text: [{ type: 'text', text: { content } }] };
        } else if (type === 'heading_1' || type === 'heading_2' || type === 'heading_3') {
          blockData[type] = { text: [{ type: 'text', text: { content } }] };
        }

        const payload = { children: [blockData] };
        const res = await axios.patch(`${baseUrl}/blocks/${pageId}/children`, payload, { headers });
        return { success: true, block: res.data.results?.[0] };
      }

      case 'listRecords': {
        const databaseId = render(config.databaseId);
        const res = await axios.post(`${baseUrl}/databases/${databaseId}/query`, {}, { headers });
        return { success: true, records: res.data.results };
      }

      case 'getRecord': {
        const pageId = render(config.pageId);
        const res = await axios.get(`${baseUrl}/pages/${pageId}`, { headers });
        return { success: true, record: res.data };
      }

      case 'createRecord': {
        const databaseId = render(config.databaseId);
        const propertiesStr = render(config.properties);
        let properties: any = {};
        try {
          properties = JSON.parse(propertiesStr);
        } catch {
          properties = { title: [{ text: { content: propertiesStr } }] };
        }

        const payload = {
          parent: { database_id: databaseId },
          properties,
        };
        const res = await axios.post(`${baseUrl}/pages`, payload, { headers });
        return { success: true, record: res.data };
      }

      case 'updateRecord': {
        const pageId = render(config.pageId);
        const propertiesStr = render(config.properties);
        let properties: any = {};
        try {
          properties = JSON.parse(propertiesStr);
        } catch {
          properties = {};
        }

        const payload = { properties };
        const res = await axios.patch(`${baseUrl}/pages/${pageId}`, payload, { headers });
        return { success: true, record: res.data };
      }

      case 'deleteRecord': {
        const pageId = render(config.pageId);
        const payload = { archived: true };
        const res = await axios.patch(`${baseUrl}/pages/${pageId}`, payload, { headers });
        return { success: true, pageId, archived: true };
      }

      case 'search': {
        const query = render(config.query);
        const res = await axios.post(`${baseUrl}/search`, { query }, { headers });
        return { success: true, results: res.data.results };
      }

      case 'filterDatabase': {
        const databaseId = render(config.databaseId);
        const filterStr = render(config.filter);
        let filter: any = {};
        try {
          filter = JSON.parse(filterStr);
        } catch {
          filter = { property: config.filter, text: { contains: config.filter } };
        }

        const payload = { filter };
        const res = await axios.post(`${baseUrl}/databases/${databaseId}/query`, payload, { headers });
        return { success: true, records: res.data.results };
      }

      case 'sortDatabase': {
        const databaseId = render(config.databaseId);
        const property = render(config.property);
        const direction = render(config.direction || 'ascending');

        const payload = {
          sorts: [{ property, direction }],
        };
        const res = await axios.post(`${baseUrl}/databases/${databaseId}/query`, payload, { headers });
        return { success: true, records: res.data.results };
      }

      default:
        throw new Error(`Unknown Notion operation: ${operation}`);
    }
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message;
    throw new Error(`[Notion Error] ${msg}`);
  }
};
