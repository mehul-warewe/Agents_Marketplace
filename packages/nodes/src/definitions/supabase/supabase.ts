import type { NodeDefinition } from '../../types.js';

export const supabaseNode: NodeDefinition = {
  id: 'supabase.mcp',
  label: 'Supabase',
  name: 'Supabase',
  category: 'Tools',
  variant: 'connector',
  description: 'Complete Supabase integration - manage databases, rows, auth, storage, and RPC functions.',
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
    { key: 'mcpUrl', label: 'MCP Server URL', type: 'hidden', default: 'http://localhost:3005/sse' },
    { key: 'resource', label: 'Resource Type', type: 'select', options: ['database', 'auth', 'storage', 'function'], default: 'database' },
    { key: 'operation', label: 'Operation', type: 'select', options: ['listTables', 'getTable', 'createTable', 'updateTable', 'deleteTable', 'listRows', 'getRow', 'createRow', 'updateRow', 'deleteRow', 'bulkInsert', 'bulkUpdate', 'bulkDelete', 'searchRows', 'filterRows', 'sortRows', 'listUsers', 'getUser', 'updateUser', 'deleteUser', 'uploadFile', 'downloadFile', 'listFiles', 'deleteFile', 'select', 'insert', 'update', 'delete', 'rpc'], default: 'listRows' },
  ],
  operationInputs: {
    listTables: [
    ],
    getTable: [
      { key: 'table', label: 'Table Name', type: 'string', required: true, description: 'Table to get schema', example: 'users' },
    ],
    createTable: [
      { key: 'table', label: 'Table Name', type: 'string', required: true, description: 'New table name', example: 'products' },
      { key: 'schema', label: 'Schema (JSON)', type: 'string', required: true, description: 'Column definitions', example: '{"id":"uuid","name":"text"}' },
    ],
    updateTable: [
      { key: 'table', label: 'Table Name', type: 'string', required: true, description: 'Table to update', example: 'users' },
      { key: 'schema', label: 'Schema (JSON)', type: 'string', required: true, description: 'Updated schema', example: '{"newColumn":"text"}' },
    ],
    deleteTable: [
      { key: 'table', label: 'Table Name', type: 'string', required: true, description: 'Table to delete', example: 'users' },
    ],
    listRows: [
      { key: 'table', label: 'Table', type: 'string', required: true, description: 'Table name', example: 'users' },
      { key: 'limit', label: 'Limit', type: 'string', required: false, description: 'Row limit', example: '20' },
      { key: 'offset', label: 'Offset', type: 'string', required: false, description: 'Offset rows', example: '0' },
    ],
    getRow: [
      { key: 'table', label: 'Table', type: 'string', required: true, description: 'Table name', example: 'users' },
      { key: 'id', label: 'Row ID', type: 'string', required: true, description: 'Primary key value', example: '123' },
    ],
    createRow: [
      { key: 'table', label: 'Table', type: 'string', required: true, description: 'Table name', example: 'users' },
      { key: 'values', label: 'Values (JSON)', type: 'string', required: true, description: 'Row data', example: '{"name":"John","email":"john@example.com"}' },
    ],
    updateRow: [
      { key: 'table', label: 'Table', type: 'string', required: true, description: 'Table name', example: 'users' },
      { key: 'id', label: 'Row ID', type: 'string', required: true, description: 'Primary key', example: '123' },
      { key: 'values', label: 'Values (JSON)', type: 'string', required: true, description: 'Updated data', example: '{"name":"Jane"}' },
    ],
    deleteRow: [
      { key: 'table', label: 'Table', type: 'string', required: true, description: 'Table name', example: 'users' },
      { key: 'id', label: 'Row ID', type: 'string', required: true, description: 'Primary key', example: '123' },
    ],
    bulkInsert: [
      { key: 'table', label: 'Table', type: 'string', required: true, description: 'Table name', example: 'users' },
      { key: 'rows', label: 'Rows (JSON)', type: 'string', required: true, description: 'Array of rows', example: '[{"name":"John"},{"name":"Jane"}]' },
    ],
    bulkUpdate: [
      { key: 'table', label: 'Table', type: 'string', required: true, description: 'Table name', example: 'users' },
      { key: 'updates', label: 'Updates (JSON)', type: 'string', required: true, description: 'Update spec: {"where":{"id":[1,2]},"set":{"status":"active"}}', example: '{"where":{"id":[1,2]},"set":{"status":"active"}}' },
    ],
    bulkDelete: [
      { key: 'table', label: 'Table', type: 'string', required: true, description: 'Table name', example: 'users' },
      { key: 'ids', label: 'IDs (JSON Array)', type: 'string', required: true, description: 'IDs to delete', example: '[1, 2, 3]' },
    ],
    searchRows: [
      { key: 'table', label: 'Table', type: 'string', required: true, description: 'Table name', example: 'users' },
      { key: 'column', label: 'Column', type: 'string', required: true, description: 'Search column', example: 'name' },
      { key: 'query', label: 'Query', type: 'string', required: true, description: 'Search term', example: 'john' },
    ],
    filterRows: [
      { key: 'table', label: 'Table', type: 'string', required: true, description: 'Table name', example: 'users' },
      { key: 'filter', label: 'Filter (JSON)', type: 'string', required: true, description: 'Filter conditions', example: '{"status":"active"}' },
    ],
    sortRows: [
      { key: 'table', label: 'Table', type: 'string', required: true, description: 'Table name', example: 'users' },
      { key: 'column', label: 'Column', type: 'string', required: true, description: 'Sort by column', example: 'created_at' },
      { key: 'direction', label: 'Direction', type: 'string', required: false, description: 'asc or desc', example: 'desc' },
    ],
    listUsers: [
    ],
    getUser: [
      { key: 'userId', label: 'User ID', type: 'string', required: true, description: 'User to fetch', example: 'user_123' },
    ],
    updateUser: [
      { key: 'userId', label: 'User ID', type: 'string', required: true, description: 'User to update', example: 'user_123' },
      { key: 'email', label: 'Email', type: 'string', required: false, description: 'New email', example: 'new@example.com' },
      { key: 'metadata', label: 'Metadata (JSON)', type: 'string', required: false, description: 'User metadata', example: '{"role":"admin"}' },
    ],
    deleteUser: [
      { key: 'userId', label: 'User ID', type: 'string', required: true, description: 'User to delete', example: 'user_123' },
    ],
    uploadFile: [
      { key: 'bucket', label: 'Bucket', type: 'string', required: true, description: 'Storage bucket', example: 'avatars' },
      { key: 'path', label: 'File Path', type: 'string', required: true, description: 'File path in bucket', example: 'user_123/avatar.png' },
      { key: 'file', label: 'File Content', type: 'string', required: true, description: 'Raw file content', example: '...' },
    ],
    downloadFile: [
      { key: 'bucket', label: 'Bucket', type: 'string', required: true, description: 'Storage bucket', example: 'avatars' },
      { key: 'path', label: 'File Path', type: 'string', required: true, description: 'File path', example: 'user_123/avatar.png' },
    ],
    listFiles: [
      { key: 'bucket', label: 'Bucket', type: 'string', required: true, description: 'Storage bucket', example: 'avatars' },
      { key: 'prefix', label: 'Prefix', type: 'string', required: false, description: 'Path prefix', example: 'user_123/' },
    ],
    deleteFile: [
      { key: 'bucket', label: 'Bucket', type: 'string', required: true, description: 'Storage bucket', example: 'avatars' },
      { key: 'path', label: 'File Path', type: 'string', required: true, description: 'File to delete', example: 'user_123/avatar.png' },
    ],
    select: [
      { key: 'table', label: 'Table', type: 'string', required: true, description: 'Table name', example: 'users' },
      { key: 'select', label: 'Columns', type: 'string', required: false, description: 'Column list', example: '*' },
      { key: 'filter', label: 'Filter (JSON)', type: 'string', required: false, description: 'Filter conditions', example: '{"id":1}' },
    ],
    insert: [
      { key: 'table', label: 'Table', type: 'string', required: true, description: 'Table name', example: 'users' },
      { key: 'values', label: 'Values (JSON)', type: 'string', required: true, description: 'Row data', example: '{"name":"John"}' },
    ],
    update: [
      { key: 'table', label: 'Table', type: 'string', required: true, description: 'Table name', example: 'users' },
      { key: 'values', label: 'Values (JSON)', type: 'string', required: true, description: 'Updated data', example: '{"name":"Jane"}' },
      { key: 'filter', label: 'Filter (JSON)', type: 'string', required: true, description: 'Where condition', example: '{"id":1}' },
    ],
    delete: [
      { key: 'table', label: 'Table', type: 'string', required: true, description: 'Table name', example: 'users' },
      { key: 'filter', label: 'Filter (JSON)', type: 'string', required: true, description: 'Where condition', example: '{"id":1}' },
    ],
    rpc: [
      { key: 'function', label: 'Function', type: 'string', required: true, description: 'Function name', example: 'calculate' },
      { key: 'params', label: 'Parameters (JSON)', type: 'string', required: false, description: 'Function args', example: '{}' },
    ],
  },
  operationOutputs: {
    listTables: [
      { key: 'status', type: 'string' },
      { key: 'data.tables[0].name', type: 'string' },
      { key: 'data.count', type: 'number' },
    ],
    getTable: [
      { key: 'status', type: 'string' },
      { key: 'data.table', type: 'string' },
      { key: 'data.schema', type: 'object' },
    ],
    createTable: [ { key: 'status', type: 'string' } ],
    updateTable: [ { key: 'status', type: 'string' } ],
    deleteTable: [ { key: 'status', type: 'string' } ],
    listRows: [
      { key: 'status', type: 'string' },
      { key: 'data.rows[0]', type: 'object' },
      { key: 'data.count', type: 'number' },
    ],
    getRow: [
      { key: 'status', type: 'string' },
      { key: 'data.row', type: 'object' },
    ],
    createRow: [
      { key: 'status', type: 'string' },
      { key: 'data.row', type: 'object' },
    ],
    updateRow: [
      { key: 'status', type: 'string' },
      { key: 'data.row', type: 'object' },
    ],
    deleteRow: [
      { key: 'status', type: 'string' },
    ],
    bulkInsert: [
      { key: 'status', type: 'string' },
      { key: 'data.rows[0]', type: 'object' },
      { key: 'data.count', type: 'number' },
    ],
    bulkUpdate: [
      { key: 'status', type: 'string' },
      { key: 'data.count', type: 'number' },
    ],
    bulkDelete: [
      { key: 'status', type: 'string' },
      { key: 'data.count', type: 'number' },
    ],
    searchRows: [
      { key: 'status', type: 'string' },
      { key: 'data.rows[0]', type: 'object' },
      { key: 'data.count', type: 'number' },
    ],
    filterRows: [
      { key: 'status', type: 'string' },
      { key: 'data.rows[0]', type: 'object' },
      { key: 'data.count', type: 'number' },
    ],
    sortRows: [
      { key: 'status', type: 'string' },
      { key: 'data.rows[0]', type: 'object' },
      { key: 'data.count', type: 'number' },
    ],
    listUsers: [
      { key: 'status', type: 'string' },
      { key: 'data.users[0].id', type: 'string' },
      { key: 'data.users[0].email', type: 'string' },
      { key: 'data.count', type: 'number' },
    ],
    getUser: [
      { key: 'status', type: 'string' },
      { key: 'data.user.id', type: 'string' },
      { key: 'data.user.email', type: 'string' },
    ],
    updateUser: [
      { key: 'status', type: 'string' },
      { key: 'data.user.id', type: 'string' },
    ],
    deleteUser: [
      { key: 'status', type: 'string' },
    ],
    uploadFile: [
      { key: 'status', type: 'string' },
      { key: 'data.path', type: 'string' },
      { key: 'data.bucket', type: 'string' },
    ],
    downloadFile: [
      { key: 'status', type: 'string' },
      { key: 'data.file', type: 'string' },
      { key: 'data.size', type: 'number' },
    ],
    listFiles: [
      { key: 'status', type: 'string' },
      { key: 'data.files[0].name', type: 'string' },
      { key: 'data.count', type: 'number' },
    ],
    deleteFile: [
      { key: 'status', type: 'string' },
    ],
    select: [
      { key: 'status', type: 'string' },
      { key: 'data.data[0]', type: 'object' },
      { key: 'data.count', type: 'number' },
    ],
    insert: [
      { key: 'status', type: 'string' },
      { key: 'data.data[0]', type: 'object' },
      { key: 'data.count', type: 'number' },
    ],
    update: [
      { key: 'status', type: 'string' },
      { key: 'data.count', type: 'number' },
    ],
    delete: [
      { key: 'status', type: 'string' },
    ],
    rpc: [
      { key: 'status', type: 'string' },
      { key: 'data.data', type: 'any' },
    ],
  },
  requiredInputs: [
    {
      key: 'operation',
      label: 'Operation',
      type: 'string',
      required: true,
      description: 'Supabase operation to perform',
      example: 'listRows',
    },
  ],
  outputSchema: [
    { key: 'data', type: 'any', description: 'Query results', example: {} },
    { key: 'status', type: 'string', description: 'Operation status', example: 'success' },
  ],
};
