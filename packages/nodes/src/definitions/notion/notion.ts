import type { NodeDefinition } from '../../types.js';

export const notionNode: NodeDefinition = {
  id: 'notion.mcp',
  label: 'Notion',
  name: 'Notion',
  category: 'Tools',
  variant: 'connector',
  description: 'Search and update Notion pages via your Notion Integration Token.',
  icon: '/iconSvg/notion.svg',
  color: '#000000',
  executionKey: 'platform_mcp_handler',
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'tool', position: 'bottom' }],
  isTrigger: false,
  bg: 'bg-[#000000]/10',
  border: 'border-[#000000]/20',
  credentialTypes: ['notion_integration_token'],
  configFields: [
    { key: 'auth_notice', label: 'Note: You MUST "Add Connection" to each page/database in Notion menu.', type: 'notice' },
    { key: 'platform', label: 'Platform', type: 'hidden', default: 'notion' },
    { key: 'mcpUrl', label: 'MCP Server URL', type: 'text', placeholder: 'http://localhost:3004/sse', default: 'http://localhost:3004/sse' },
    { key: 'resource', label: 'Resource', type: 'select', options: ['page', 'database', 'block'], default: 'page' },
    { key: 'operation', label: 'Operation', type: 'select', options: ['search', 'create', 'get', 'update'], default: 'search' },
  ],
  operationFields: {
    search: [{ key: 'query', label: 'Search Query', type: 'text' }],
    create: [
      { key: 'parentId', label: 'Parent Page ID', type: 'text' },
      { key: 'title', label: 'Page Title', type: 'text' },
    ]
  }
};
