import type { NodeDefinition } from '../../types.js';

export const githubNode: NodeDefinition = {
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
    { key: 'auth_notice', label: 'Note: Ensure your PAT has "repo" and "workflow" scopes.', type: 'notice' },
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
};
