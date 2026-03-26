import type { NodeDefinition } from '../../types.js';

export const notionNode: NodeDefinition = {
  id: 'notion.mcp',
  label: 'Notion',
  name: 'Notion',
  category: 'Tools',
  variant: 'connector',
  description: 'Complete Notion integration - manage pages, databases, blocks, records, and search.',
  icon: '/iconSvg/notion.svg',
  color: '#000000',
  executionKey: 'notion_mcp',
  usableAsTool: true,
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'any', position: 'right' }],
  isTrigger: false,
  bg: 'bg-[#000000]/10',
  border: 'border-[#000000]/20',
  credentialTypes: ['notion_integration_token'],
  configFields: [
    { key: 'auth_notice', label: 'Note: You MUST "Add Connection" to each page/database in Notion menu.', type: 'notice' },
    { key: 'platform', label: 'Platform', type: 'hidden', default: 'notion' },
    { key: 'mcpUrl', label: 'MCP Server URL', type: 'text', placeholder: 'http://localhost:3004/sse', default: 'http://localhost:3004/sse' },
    { key: 'resource', label: 'Resource Type', type: 'select', options: ['page', 'database', 'block', 'record', 'search'], default: 'page' },
    { key: 'operation', label: 'Operation', type: 'select', options: ['listDatabases', 'getDatabase', 'createDatabase', 'updateDatabase', 'listPages', 'getPage', 'createPage', 'updatePage', 'deletePage', 'archivePage', 'listBlocks', 'getBlock', 'createBlock', 'updateBlock', 'deleteBlock', 'appendBlock', 'listRecords', 'getRecord', 'createRecord', 'updateRecord', 'deleteRecord', 'search', 'filterDatabase', 'sortDatabase'], default: 'search' },
  ],
  operationInputs: {
    listDatabases: [
    ],
    getDatabase: [
      { key: 'databaseId', label: 'Database ID', type: 'string', required: true, description: 'Database to fetch', example: 'db_123' },
    ],
    createDatabase: [
      { key: 'title', label: 'Title', type: 'string', required: true, description: 'Database name', example: 'Products' },
      { key: 'parentId', label: 'Parent ID', type: 'string', required: false, description: 'Parent page', example: 'page_123' },
    ],
    updateDatabase: [
      { key: 'databaseId', label: 'Database ID', type: 'string', required: true, description: 'Database to update', example: 'db_123' },
      { key: 'title', label: 'Title', type: 'string', required: false, description: 'New name', example: 'Updated name' },
    ],
    listPages: [
      { key: 'parentId', label: 'Parent ID', type: 'string', required: false, description: 'Parent page', example: 'page_123' },
    ],
    getPage: [
      { key: 'pageId', label: 'Page ID', type: 'string', required: true, description: 'Page to fetch', example: 'page_123' },
    ],
    createPage: [
      { key: 'parentId', label: 'Parent ID', type: 'string', required: true, description: 'Parent page/database', example: 'page_123' },
      { key: 'title', label: 'Title', type: 'string', required: true, description: 'Page title', example: 'New Page' },
      { key: 'properties', label: 'Properties (JSON)', type: 'string', required: false, description: 'Database properties', example: '{"Name":"value"}' },
    ],
    updatePage: [
      { key: 'pageId', label: 'Page ID', type: 'string', required: true, description: 'Page to update', example: 'page_123' },
      { key: 'title', label: 'Title', type: 'string', required: false, description: 'New title', example: 'Updated Title' },
      { key: 'properties', label: 'Properties (JSON)', type: 'string', required: false, description: 'Updated properties', example: '{"Status":"Done"}' },
    ],
    deletePage: [
      { key: 'pageId', label: 'Page ID', type: 'string', required: true, description: 'Page to delete', example: 'page_123' },
    ],
    archivePage: [
      { key: 'pageId', label: 'Page ID', type: 'string', required: true, description: 'Page to archive', example: 'page_123' },
    ],
    listBlocks: [
      { key: 'pageId', label: 'Page ID', type: 'string', required: true, description: 'Page to list blocks from', example: 'page_123' },
    ],
    getBlock: [
      { key: 'blockId', label: 'Block ID', type: 'string', required: true, description: 'Block to fetch', example: 'block_456' },
    ],
    createBlock: [
      { key: 'pageId', label: 'Page ID', type: 'string', required: true, description: 'Page for block', example: 'page_123' },
      { key: 'type', label: 'Block Type', type: 'string', required: true, description: 'paragraph, heading, etc.', example: 'paragraph' },
      { key: 'content', label: 'Content', type: 'string', required: true, description: 'Block content', example: 'Text content' },
    ],
    updateBlock: [
      { key: 'blockId', label: 'Block ID', type: 'string', required: true, description: 'Block to update', example: 'block_456' },
      { key: 'content', label: 'Content', type: 'string', required: true, description: 'New content', example: 'Updated content' },
    ],
    deleteBlock: [
      { key: 'blockId', label: 'Block ID', type: 'string', required: true, description: 'Block to delete', example: 'block_456' },
    ],
    appendBlock: [
      { key: 'pageId', label: 'Page ID', type: 'string', required: true, description: 'Page to append to', example: 'page_123' },
      { key: 'type', label: 'Block Type', type: 'string', required: true, description: 'Block type', example: 'paragraph' },
      { key: 'content', label: 'Content', type: 'string', required: true, description: 'Block content', example: 'New block' },
    ],
    listRecords: [
      { key: 'databaseId', label: 'Database ID', type: 'string', required: true, description: 'Database to list from', example: 'db_123' },
    ],
    getRecord: [
      { key: 'pageId', label: 'Record ID', type: 'string', required: true, description: 'Record to fetch', example: 'page_789' },
    ],
    createRecord: [
      { key: 'databaseId', label: 'Database ID', type: 'string', required: true, description: 'Target database', example: 'db_123' },
      { key: 'properties', label: 'Properties (JSON)', type: 'string', required: true, description: 'Record data', example: '{"Name":"John","Status":"Active"}' },
    ],
    updateRecord: [
      { key: 'pageId', label: 'Record ID', type: 'string', required: true, description: 'Record to update', example: 'page_789' },
      { key: 'properties', label: 'Properties (JSON)', type: 'string', required: true, description: 'Updated data', example: '{"Status":"Done"}' },
    ],
    deleteRecord: [
      { key: 'pageId', label: 'Record ID', type: 'string', required: true, description: 'Record to delete', example: 'page_789' },
    ],
    search: [
      { key: 'query', label: 'Query', type: 'string', required: true, description: 'Search terms', example: 'product roadmap' },
    ],
    filterDatabase: [
      { key: 'databaseId', label: 'Database ID', type: 'string', required: true, description: 'Database to filter', example: 'db_123' },
      { key: 'filter', label: 'Filter (JSON)', type: 'string', required: true, description: 'Filter spec', example: '{"property":"Status","equals":"Done"}' },
    ],
    sortDatabase: [
      { key: 'databaseId', label: 'Database ID', type: 'string', required: true, description: 'Database to sort', example: 'db_123' },
      { key: 'property', label: 'Property', type: 'string', required: true, description: 'Sort by property', example: 'Created' },
      { key: 'direction', label: 'Direction', type: 'string', required: false, description: 'ascending or descending', example: 'descending' },
    ],
  },
  requiredInputs: [
    {
      key: 'operation',
      label: 'Operation',
      type: 'string',
      required: true,
      description: 'Notion operation to perform',
      example: 'search',
    },
  ],
  outputSchema: [
    { key: 'id', type: 'string', description: 'Page/Record ID', example: 'page_123' },
    { key: 'title', type: 'string', description: 'Page title', example: 'Page Title' },
    { key: 'url', type: 'string', description: 'Notion URL', example: 'https://notion.so/...' },
    { key: 'status', type: 'string', description: 'Operation status', example: 'success' },
  ],
};
