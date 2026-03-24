import type { NodeDefinition } from '../../types.js';

export const linearNode: NodeDefinition = {
  id: 'linear.mcp',
  label: 'Linear',
  name: 'Linear',
  category: 'Tools',
  variant: 'connector',
  description: 'Manage Linear issues and projects via your Linear API Key.',
  icon: '/iconSvg/linear.svg',
  color: '#5E6AD2',
  executionKey: 'platform_mcp_handler',
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'tool', position: 'bottom' }],
  isTrigger: false,
  bg: 'bg-[#5E6AD2]/10',
  border: 'border-[#5E6AD2]/20',
  credentialTypes: ['linear_api_key'],
  configFields: [
    { key: 'platform', label: 'Platform', type: 'hidden', default: 'linear' },
    { key: 'mcpUrl', label: 'MCP Server URL', type: 'text', placeholder: 'http://localhost:3003/sse', default: 'http://localhost:3003/sse' },
    { key: 'resource', label: 'Resource', type: 'select', options: ['issue', 'project', 'cycle'], default: 'issue' },
    { key: 'operation', label: 'Operation', type: 'select', options: ['create', 'list', 'get', 'update'], default: 'list' },
  ],
  operationFields: {
    create: [
      { key: 'teamId', label: 'Team ID', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
    list: [{ key: 'first', label: 'Batch Size', type: 'text', placeholder: '50' }]
  }
};
