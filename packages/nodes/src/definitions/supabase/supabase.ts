import type { NodeDefinition } from '../../types.js';

export const supabaseNode: NodeDefinition = {
  id: 'supabase.mcp',
  label: 'Supabase',
  name: 'Supabase',
  category: 'Tools',
  variant: 'connector',
  description: 'Query and manage Supabase databases via your Service Role Key.',
  icon: '/iconSvg/supabase.svg',
  color: '#3ecf8e',
  executionKey: 'supabase_mcp',
  usableAsTool: true,
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'any', position: 'right' }],
  isTrigger: false,
  bg: 'bg-[#3ecf8e]/10',
  border: 'border-[#3ecf8e]/20',
  credentialTypes: ['supabase_service_role'],
  configFields: [
    { key: 'platform', label: 'Platform', type: 'hidden', default: 'supabase' },
    { key: 'mcpUrl', label: 'MCP Server URL', type: 'text', placeholder: 'http://localhost:3005/sse', default: 'http://localhost:3005/sse' },
    { key: 'resource', label: 'Resource', type: 'select', options: ['database', 'auth', 'storage'], default: 'database' },
    { key: 'operation', label: 'Operation', type: 'select', options: ['select', 'insert', 'update', 'delete', 'rpc'], default: 'select' },
  ],
  operationFields: {
    select: [
      { key: 'table', label: 'Table Name', type: 'text' },
      { key: 'select', label: 'Columns (*)', type: 'text', default: '*' },
      { key: 'filter', label: 'Filter (JSON)', type: 'text' },
    ],
    insert: [
      { key: 'table', label: 'Table Name', type: 'text' },
      { key: 'values', label: 'Values (JSON)', type: 'textarea' },
    ]
  }
};
