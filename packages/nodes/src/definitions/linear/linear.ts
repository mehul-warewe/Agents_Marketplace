import type { NodeDefinition } from '../../types.js';

export const linearNode: NodeDefinition = {
  id: 'linear.mcp',
  label: 'Linear',
  name: 'Linear',
  category: 'Tools',
  variant: 'connector',
  description: 'Complete Linear integration - manage issues, projects, teams, cycles, and comments.',
  icon: '/iconSvg/linear.svg',
  color: '#5E6AD2',
  executionKey: 'linear_mcp',
  usableAsTool: true,
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'any', position: 'right' }],
  isTrigger: false,
  bg: 'bg-[#5E6AD2]/10',
  border: 'border-[#5E6AD2]/20',
  credentialTypes: ['linear_api_key'],
  configFields: [
    { key: 'platform', label: 'Platform', type: 'hidden', default: 'linear' },
    { key: 'mcpUrl', label: 'MCP Server URL', type: 'text', placeholder: 'http://localhost:3003/sse', default: 'http://localhost:3003/sse' },
    { key: 'resource', label: 'Resource Type', type: 'select', options: ['issue', 'project', 'team', 'cycle', 'comment'], default: 'issue' },
    { key: 'operation', label: 'Operation', type: 'select', options: ['listIssues', 'getIssue', 'createIssue', 'updateIssue', 'deleteIssue', 'archiveIssue', 'unarchiveIssue', 'assignIssue', 'unassignIssue', 'changeStatus', 'changePriority', 'addLabel', 'removeLabel', 'addToProject', 'removeFromProject', 'listComments', 'createComment', 'updateComment', 'deleteComment', 'listProjects', 'getProject', 'createProject', 'updateProject', 'deleteProject', 'listTeams', 'getTeam', 'createTeam', 'listMembers', 'listCycles', 'getCycle', 'createCycle', 'updateCycle'], default: 'listIssues' },
  ],
  operationInputs: {
    listIssues: [
      { key: 'first', label: 'Batch Size', type: 'string', required: false, description: 'Limit results', example: '50' },
      { key: 'teamId', label: 'Team ID', type: 'string', required: false, description: 'Filter by team', example: 'team_123' },
      { key: 'status', label: 'Status Filter', type: 'string', required: false, description: 'Status to filter', example: 'Todo' },
    ],
    getIssue: [
      { key: 'issueId', label: 'Issue ID', type: 'string', required: true, description: 'Issue to fetch', example: 'LINEAR-123' },
    ],
    createIssue: [
      { key: 'teamId', label: 'Team ID', type: 'string', required: true, description: 'Target team ID', example: 'team-123' },
      { key: 'title', label: 'Title', type: 'string', required: true, description: 'Issue title', example: 'Bug: Fix login' },
      { key: 'description', label: 'Description', type: 'string', required: false, description: 'Issue details', example: 'Error occurs on...' },
      { key: 'priority', label: 'Priority', type: 'string', required: false, description: '0 to 4 (0=none)', example: '1' },
      { key: 'assigneeId', label: 'Assignee ID', type: 'string', required: false, description: 'User ID to assign', example: 'user-456' },
      { key: 'stateId', label: 'State ID', type: 'string', required: false, description: 'Status state ID', example: 'state-uuid' },
      { key: 'labelIds', label: 'Label IDs', type: 'string', required: false, description: 'Comma-separated label IDs', example: 'label-1,label-2' },
    ],
    updateIssue: [
      { key: 'issueId', label: 'Issue ID', type: 'string', required: true, description: 'Issue to update', example: 'LINEAR-123' },
      { key: 'title', label: 'Title', type: 'string', required: false, description: 'New title', example: 'Updated title' },
      { key: 'description', label: 'Description', type: 'string', required: false, description: 'New description', example: 'Updated...' },
    ],
    deleteIssue: [
      { key: 'issueId', label: 'Issue ID', type: 'string', required: true, description: 'Issue to delete', example: 'LINEAR-123' },
    ],
    archiveIssue: [
      { key: 'issueId', label: 'Issue ID', type: 'string', required: true, description: 'Issue to archive', example: 'LINEAR-123' },
    ],
    unarchiveIssue: [
      { key: 'issueId', label: 'Issue ID', type: 'string', required: true, description: 'Issue to unarchive', example: 'LINEAR-123' },
    ],
    assignIssue: [
      { key: 'issueId', label: 'Issue ID', type: 'string', required: true, description: 'Issue', example: 'LINEAR-123' },
      { key: 'userId', label: 'User ID', type: 'string', required: true, description: 'User to assign', example: 'user_123' },
    ],
    unassignIssue: [
      { key: 'issueId', label: 'Issue ID', type: 'string', required: true, description: 'Issue', example: 'LINEAR-123' },
    ],
    changeStatus: [
      { key: 'issueId', label: 'Issue ID', type: 'string', required: true, description: 'Issue', example: 'LINEAR-123' },
      { key: 'state', label: 'New State', type: 'string', required: true, description: 'Status value', example: 'Done' },
    ],
    changePriority: [
      { key: 'issueId', label: 'Issue ID', type: 'string', required: true, description: 'Issue', example: 'LINEAR-123' },
      { key: 'priority', label: 'Priority', type: 'string', required: true, description: '0-4 scale', example: '3' },
    ],
    addLabel: [
      { key: 'issueId', label: 'Issue ID', type: 'string', required: true, description: 'Issue', example: 'LINEAR-123' },
      { key: 'labelId', label: 'Label ID', type: 'string', required: true, description: 'Label to add', example: 'label_456' },
    ],
    removeLabel: [
      { key: 'issueId', label: 'Issue ID', type: 'string', required: true, description: 'Issue', example: 'LINEAR-123' },
      { key: 'labelId', label: 'Label ID', type: 'string', required: true, description: 'Label to remove', example: 'label_456' },
    ],
    addToProject: [
      { key: 'issueId', label: 'Issue ID', type: 'string', required: true, description: 'Issue', example: 'LINEAR-123' },
      { key: 'projectId', label: 'Project ID', type: 'string', required: true, description: 'Project', example: 'project_789' },
    ],
    removeFromProject: [
      { key: 'issueId', label: 'Issue ID', type: 'string', required: true, description: 'Issue', example: 'LINEAR-123' },
      { key: 'projectId', label: 'Project ID', type: 'string', required: true, description: 'Project', example: 'project_789' },
    ],
    listComments: [
      { key: 'issueId', label: 'Issue ID', type: 'string', required: true, description: 'Issue for comments', example: 'LINEAR-123' },
    ],
    createComment: [
      { key: 'issueId', label: 'Issue ID', type: 'string', required: true, description: 'Issue', example: 'LINEAR-123' },
      { key: 'body', label: 'Comment', type: 'string', required: true, description: 'Comment text', example: 'Great progress!' },
    ],
    updateComment: [
      { key: 'commentId', label: 'Comment ID', type: 'string', required: true, description: 'Comment to update', example: 'comment_123' },
      { key: 'body', label: 'New Comment', type: 'string', required: true, description: 'Updated text', example: 'Updated comment' },
    ],
    deleteComment: [
      { key: 'commentId', label: 'Comment ID', type: 'string', required: true, description: 'Comment to delete', example: 'comment_123' },
    ],
    listProjects: [
      { key: 'first', label: 'Batch Size', type: 'string', required: false, description: 'Limit results', example: '50' },
    ],
    getProject: [
      { key: 'projectId', label: 'Project ID', type: 'string', required: true, description: 'Project to fetch', example: 'project_789' },
    ],
    createProject: [
      { key: 'name', label: 'Name', type: 'string', required: true, description: 'Project name', example: 'Q1 Roadmap' },
      { key: 'description', label: 'Description', type: 'string', required: false, description: 'Project description', example: 'Q1 goals' },
    ],
    updateProject: [
      { key: 'projectId', label: 'Project ID', type: 'string', required: true, description: 'Project', example: 'project_789' },
      { key: 'name', label: 'Name', type: 'string', required: false, description: 'New name', example: 'Updated name' },
    ],
    deleteProject: [
      { key: 'projectId', label: 'Project ID', type: 'string', required: true, description: 'Project to delete', example: 'project_789' },
    ],
    listTeams: [
    ],
    getTeam: [
      { key: 'teamId', label: 'Team ID', type: 'string', required: true, description: 'Team to fetch', example: 'team_123' },
    ],
    createTeam: [
      { key: 'name', label: 'Name', type: 'string', required: true, description: 'Team name', example: 'Backend' },
      { key: 'key', label: 'Key', type: 'string', required: true, description: 'Team key', example: 'BE' },
    ],
    listMembers: [
      { key: 'teamId', label: 'Team ID', type: 'string', required: true, description: 'Team', example: 'team_123' },
    ],
    listCycles: [
      { key: 'teamId', label: 'Team ID', type: 'string', required: false, description: 'Filter by team', example: 'team_123' },
    ],
    getCycle: [
      { key: 'cycleId', label: 'Cycle ID', type: 'string', required: true, description: 'Cycle to fetch', example: 'cycle_456' },
    ],
    createCycle: [
      { key: 'teamId', label: 'Team ID', type: 'string', required: true, description: 'Team for cycle', example: 'team_123' },
      { key: 'name', label: 'Name', type: 'string', required: true, description: 'Cycle name', example: 'Sprint 1' },
      { key: 'startDate', label: 'Start Date', type: 'string', required: true, description: 'ISO date', example: '2024-03-20' },
      { key: 'endDate', label: 'End Date', type: 'string', required: true, description: 'ISO date', example: '2024-04-03' },
    ],
    updateCycle: [
      { key: 'cycleId', label: 'Cycle ID', type: 'string', required: true, description: 'Cycle to update', example: 'cycle_456' },
      { key: 'name', label: 'Name', type: 'string', required: false, description: 'New name', example: 'Sprint 2' },
    ],
  },
  requiredInputs: [
    {
      key: 'operation',
      label: 'Operation',
      type: 'string',
      required: true,
      description: 'Linear operation to perform',
      example: 'listIssues',
    },
  ],
  operationOutputs: {
    listIssues: [
      { key: 'status', type: 'string' },
      { key: 'data.issues[0].id', type: 'string' },
      { key: 'data.issues[0].title', type: 'string' },
      { key: 'data.issues[0].status', type: 'string' },
    ],
    getIssue: [
      { key: 'status', type: 'string' },
      { key: 'data.issue.id', type: 'string' },
      { key: 'data.issue.title', type: 'string' },
    ],
    createIssue: [
      { key: 'status', type: 'string' },
      { key: 'data.issue.id', type: 'string' },
    ],
    updateIssue: [
      { key: 'status', type: 'string' },
      { key: 'data.issue.id', type: 'string' },
    ],
    deleteIssue: [
      { key: 'status', type: 'string' },
    ],
    archiveIssue: [
      { key: 'status', type: 'string' },
    ],
    unarchiveIssue: [
      { key: 'status', type: 'string' },
    ],
    assignIssue: [
      { key: 'status', type: 'string' },
      { key: 'data.issue.id', type: 'string' },
    ],
    unassignIssue: [
      { key: 'status', type: 'string' },
    ],
    changeStatus: [
      { key: 'status', type: 'string' },
      { key: 'data.issue.state.name', type: 'string' },
    ],
    changePriority: [
      { key: 'status', type: 'string' },
    ],
    addLabel: [
      { key: 'status', type: 'string' },
    ],
    removeLabel: [
      { key: 'status', type: 'string' },
    ],
    addToProject: [
      { key: 'status', type: 'string' },
    ],
    removeFromProject: [
      { key: 'status', type: 'string' },
    ],
    listComments: [
      { key: 'status', type: 'string' },
      { key: 'data.comments[0].body', type: 'string' },
    ],
    createComment: [
      { key: 'status', type: 'string' },
      { key: 'data.comment.id', type: 'string' },
    ],
    updateComment: [
      { key: 'status', type: 'string' },
    ],
    deleteComment: [
      { key: 'status', type: 'string' },
    ],
    listProjects: [
      { key: 'status', type: 'string' },
      { key: 'data.projects[0].name', type: 'string' },
    ],
    getProject: [
      { key: 'status', type: 'string' },
      { key: 'data.project.name', type: 'string' },
    ],
    createProject: [
      { key: 'status', type: 'string' },
      { key: 'data.project.id', type: 'string' },
    ],
    updateProject: [
      { key: 'status', type: 'string' },
    ],
    deleteProject: [
      { key: 'status', type: 'string' },
    ],
    listTeams: [
      { key: 'status', type: 'string' },
      { key: 'data.teams[0].name', type: 'string' },
    ],
    getTeam: [
      { key: 'status', type: 'string' },
      { key: 'data.team.name', type: 'string' },
    ],
    createTeam: [
      { key: 'status', type: 'string' },
      { key: 'data.team.id', type: 'string' },
    ],
    listMembers: [
      { key: 'status', type: 'string' },
      { key: 'data.members[0].name', type: 'string' },
    ],
    listCycles: [
      { key: 'status', type: 'string' },
      { key: 'data.cycles[0].name', type: 'string' },
    ],
    getCycle: [
      { key: 'status', type: 'string' },
      { key: 'data.cycle.name', type: 'string' },
    ],
    createCycle: [
      { key: 'status', type: 'string' },
    ],
    updateCycle: [
      { key: 'status', type: 'string' },
    ],
  },
  outputSchema: [
    { key: 'status', type: 'string', description: 'Operation status', example: 'success' },
    { key: 'data', type: 'any', description: 'Raw GraphQL data from Linear', example: {} },
  ],
};
