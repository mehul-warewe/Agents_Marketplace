import type { NodeDefinition } from '../types';

export const mcpNodes: NodeDefinition[] = [
  // ─── GITHUB ────────────────────────────────────────────────────────
  {
    id: 'github.mcp',
    label: 'GitHub',
    name: 'GitHub',
    category: 'Tools',
    variant: 'connector',
    description: 'Manage issues, pull requests, and repos via your GitHub Personal Access Token.',
    icon: '/iconSvg/github.svg', 
    color: '#24292e',
    executionKey: 'platform_mcp_handler', 
    inputs: [{ name: 'input', type: 'data', position: 'left' }],
    outputs: [{ name: 'output', type: 'tool', position: 'bottom' }],
    isTrigger: false,
    bg: 'bg-[#24292e]/10',
    border: 'border-[#24292e]/20',
    credentialTypes: ['github_pat'],
    configFields: [
      { key: 'platform', label: 'Platform', type: 'hidden', default: 'github' },
      { key: 'mcpUrl', label: 'MCP Server URL', type: 'text', placeholder: 'http://localhost:3001/sse', default: 'http://localhost:3001/sse' },
      { key: 'resource', label: 'Resource', type: 'select', options: ['issue', 'repository', 'pullRequest'], default: 'issue' },
      { key: 'operation', label: 'Operation', type: 'select', options: ['list', 'get', 'create', 'update'], default: 'list' },
    ],
    operationFields: {
      list: [
        { key: 'owner', label: 'Owner', type: 'text', placeholder: 'microsoft' },
        { key: 'repo', label: 'Repository', type: 'text', placeholder: 'vscode' },
      ],
      create: [
        { key: 'owner', label: 'Owner', type: 'text' },
        { key: 'repo', label: 'Repository', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'body', label: 'Body', type: 'textarea' },
      ]
    }
  },

  // ─── SLACK ─────────────────────────────────────────────────────────
  {
    id: 'slack.mcp',
    label: 'Slack',
    name: 'Slack',
    category: 'Tools',
    variant: 'connector',
    description: 'Send messages and manage channels via your Slack Bot Token.',
    icon: '/iconSvg/slack.svg',
    color: '#4A154B',
    executionKey: 'platform_mcp_handler',
    inputs: [{ name: 'input', type: 'data', position: 'left' }],
    outputs: [{ name: 'output', type: 'tool', position: 'bottom' }],
    isTrigger: false,
    bg: 'bg-[#4A154B]/10',
    border: 'border-[#4A154B]/20',
    credentialTypes: ['slack_oauth', 'slack_webhook'],
    configFields: [
      { key: 'platform', label: 'Platform', type: 'hidden', default: 'slack' },
      { key: 'mcpUrl', label: 'MCP Server URL', type: 'text', placeholder: 'http://localhost:3002/sse', default: 'http://localhost:3002/sse' },
      { key: 'resource', label: 'Resource', type: 'select', options: ['message', 'channel'], default: 'message' },
      { key: 'operation', label: 'Operation', type: 'select', options: ['post', 'list', 'info'], default: 'post' },
    ],
    operationFields: {
      post: [
        { key: 'channelId', label: 'Channel ID', type: 'text', placeholder: 'C12345678' },
        { key: 'text', label: 'Message Text', type: 'textarea' },
      ],
      list: [{ key: 'types', label: 'Channel Types', type: 'text', placeholder: 'public_channel,private_channel' }]
    }
  },

  // ─── LINEAR ────────────────────────────────────────────────────────
  {
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
  },

  // ─── NOTION ────────────────────────────────────────────────────────
  {
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
  },

  // ─── SUPABASE ──────────────────────────────────────────────────────
  {
    id: 'supabase.mcp',
    label: 'Supabase',
    name: 'Supabase',
    category: 'Tools',
    variant: 'connector',
    description: 'Query and manage Supabase databases via your Service Role Key.',
    icon: '/iconSvg/supabase.svg',
    color: '#3ecf8e',
    executionKey: 'platform_mcp_handler',
    inputs: [{ name: 'input', type: 'data', position: 'left' }],
    outputs: [{ name: 'output', type: 'tool', position: 'bottom' }],
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
  },
];
