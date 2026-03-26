import type { NodeDefinition } from '../../types.js';

export const githubNode: NodeDefinition = {
  id: 'github.mcp',
  label: 'GitHub',
  name: 'GitHub',
  category: 'Tools',
  variant: 'connector',
  description: 'Complete GitHub integration - manage repos, issues, PRs, commits, branches, and more.',
  icon: '/iconSvg/github.svg',
  color: '#24292e',
  executionKey: 'github_mcp',
  usableAsTool: true,
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'any', position: 'right' }],
  isTrigger: false,
  bg: 'bg-[#24292e]/10',
  border: 'border-[#24292e]/20',
  credentialTypes: ['github_pat'],
  configFields: [
    { key: 'auth_notice', label: 'Note: Ensure your PAT has "repo" and "workflow" scopes.', type: 'notice' },
    { key: 'resource', label: 'Resource Type', type: 'select',
      options: ['repository', 'issue', 'pullRequest', 'commit', 'branch', 'comment'],
      default: 'repository' },
    { key: 'operation', label: 'Operation', type: 'select',
      options: ['listUserRepos', 'listOrgRepos', 'listRepos', 'getRepo', 'createRepo', 'deleteRepo', 'listIssues', 'getIssue', 'createIssue', 'updateIssue', 'listPullRequests', 'getPullRequest', 'createPullRequest', 'updatePullRequest', 'mergePullRequest', 'listCommits', 'getCommit', 'listBranches', 'getBranch', 'listComments', 'createComment', 'deleteComment'],
      default: 'listUserRepos' },
  ],
  operationInputs: {
    listUserRepos: [
      { key: 'owner', label: 'Username', type: 'string', required: true, description: 'GitHub username to find repos for', example: 'torvalds' },
    ],
    listOrgRepos: [
      { key: 'owner', label: 'Organization', type: 'string', required: true, description: 'GitHub organization', example: 'microsoft' },
    ],
    listRepos: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
    ],
    getRepo: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
    ],
    createRepo: [
      { key: 'name', label: 'Repository Name', type: 'string', required: true, description: 'Name for new repo', example: 'my-awesome-project' },
      { key: 'description', label: 'Description', type: 'string', required: false, description: 'Repository description', example: 'An awesome project' },
      { key: 'private', label: 'Private', type: 'string', required: false, description: 'true or false', example: 'false' },
    ],
    deleteRepo: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
    ],
    listIssues: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'state', label: 'State', type: 'string', required: false, description: 'open, closed, or all', example: 'open' },
    ],
    getIssue: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'issueNumber', label: 'Issue Number', type: 'string', required: true, description: 'Issue number', example: '123' },
    ],
    createIssue: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'title', label: 'Title', type: 'string', required: true, description: 'Issue title', example: 'Bug: Application crashes' },
      { key: 'body', label: 'Description', type: 'string', required: false, description: 'Issue description', example: 'Steps to reproduce...' },
      { key: 'labels', label: 'Labels', type: 'string', required: false, description: 'Comma-separated labels', example: 'bug,urgent' },
    ],
    updateIssue: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'issueNumber', label: 'Issue Number', type: 'string', required: true, description: 'Issue number', example: '123' },
      { key: 'state', label: 'State', type: 'string', required: false, description: 'open or closed', example: 'open' },
      { key: 'title', label: 'Title', type: 'string', required: false, description: 'New title', example: 'Updated: Application crashes' },
    ],
    closeIssue: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'issueNumber', label: 'Issue Number', type: 'string', required: true, description: 'Issue number', example: '123' },
    ],
    reopenIssue: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'issueNumber', label: 'Issue Number', type: 'string', required: true, description: 'Issue number', example: '123' },
    ],
    addLabel: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'issueNumber', label: 'Issue Number', type: 'string', required: true, description: 'Issue number', example: '123' },
      { key: 'labels', label: 'Labels', type: 'string', required: true, description: 'Comma-separated labels to add', example: 'bug,feature' },
    ],
    removeLabel: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'issueNumber', label: 'Issue Number', type: 'string', required: true, description: 'Issue number', example: '123' },
      { key: 'labels', label: 'Labels', type: 'string', required: true, description: 'Labels to remove', example: 'wontfix' },
    ],
    listPullRequests: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'state', label: 'State', type: 'string', required: false, description: 'open, closed, or all', example: 'open' },
    ],
    getPullRequest: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'prNumber', label: 'PR Number', type: 'string', required: true, description: 'Pull request number', example: '123' },
    ],
    createPullRequest: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'title', label: 'Title', type: 'string', required: true, description: 'PR title', example: 'Add new feature' },
      { key: 'head', label: 'Head Branch', type: 'string', required: true, description: 'Source branch', example: 'feature/new-feature' },
      { key: 'base', label: 'Base Branch', type: 'string', required: true, description: 'Target branch', example: 'main' },
      { key: 'body', label: 'Description', type: 'string', required: false, description: 'PR description', example: 'Fixes issue #123' },
    ],
    mergePullRequest: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'prNumber', label: 'PR Number', type: 'string', required: true, description: 'Pull request number', example: '123' },
      { key: 'mergeMethod', label: 'Merge Method', type: 'string', required: false, description: 'merge, squash, or rebase', example: 'merge' },
    ],
    listCommits: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'branch', label: 'Branch', type: 'string', required: false, description: 'Branch name (default: main)', example: 'main' },
    ],
    getCommit: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'sha', label: 'Commit SHA', type: 'string', required: true, description: 'Commit SHA hash', example: 'abc123def456' },
    ],
    listBranches: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
    ],
    createBranch: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'branchName', label: 'Branch Name', type: 'string', required: true, description: 'New branch name', example: 'feature/new-feature' },
      { key: 'fromBranch', label: 'From Branch', type: 'string', required: false, description: 'Source branch (default: main)', example: 'main' },
    ],
    deleteBranch: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'branchName', label: 'Branch Name', type: 'string', required: true, description: 'Branch to delete', example: 'feature/old-feature' },
    ],
    listComments: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'issueNumber', label: 'Issue Number', type: 'string', required: true, description: 'Issue or PR number', example: '123' },
    ],
    createComment: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'issueNumber', label: 'Issue Number', type: 'string', required: true, description: 'Issue or PR number', example: '123' },
      { key: 'body', label: 'Comment', type: 'string', required: true, description: 'Comment text', example: 'Great work!' },
    ],
    updateComment: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'commentId', label: 'Comment ID', type: 'string', required: true, description: 'Comment ID', example: '123456' },
      { key: 'body', label: 'Comment', type: 'string', required: true, description: 'Updated comment text', example: 'Updated comment' },
    ],
    deleteComment: [
      { key: 'owner', label: 'Owner', type: 'string', required: true, description: 'Repository owner', example: 'microsoft' },
      { key: 'repo', label: 'Repository', type: 'string', required: true, description: 'Repository name', example: 'vscode' },
      { key: 'commentId', label: 'Comment ID', type: 'string', required: true, description: 'Comment ID', example: '123456' },
    ],
  },
  operationOutputs: {
    listUserRepos: [
      { key: 'repos', type: 'array', description: 'Array of repositories' },
      { key: 'count', type: 'number', description: 'Number of repositories' },
    ],
    listOrgRepos: [
      { key: 'repos', type: 'array', description: 'Array of organization repositories' },
      { key: 'count', type: 'number', description: 'Number of repositories' },
    ],
    getRepo: [
      { key: 'owner', type: 'string', description: 'Repository owner' },
      { key: 'repo', type: 'string', description: 'Repository name' },
      { key: 'url', type: 'string', description: 'Repository URL' },
      { key: 'stars', type: 'number', description: 'Star count' },
      { key: 'forks', type: 'number', description: 'Fork count' },
      { key: 'description', type: 'string', description: 'Repository description' },
    ],
    createRepo: [
      { key: 'id', type: 'string', description: 'New repository ID' },
      { key: 'name', type: 'string', description: 'Repository name' },
      { key: 'url', type: 'string', description: 'Repository URL' },
      { key: 'status', type: 'string', description: 'Creation status' },
    ],
    deleteRepo: [
      { key: 'status', type: 'string', description: 'Deletion status' },
      { key: 'success', type: 'boolean', description: 'Whether deletion succeeded' },
    ],
    listIssues: [
      { key: 'issues', type: 'array', description: 'Array of issues' },
      { key: 'count', type: 'number', description: 'Number of issues' },
    ],
    getIssue: [
      { key: 'issueNumber', type: 'number', description: 'Issue number' },
      { key: 'title', type: 'string', description: 'Issue title' },
      { key: 'state', type: 'string', description: 'Issue state (open/closed)' },
      { key: 'url', type: 'string', description: 'Issue URL' },
      { key: 'labels', type: 'array', description: 'Issue labels' },
    ],
    createIssue: [
      { key: 'issueNumber', type: 'number', description: 'Created issue number' },
      { key: 'id', type: 'string', description: 'Issue ID' },
      { key: 'url', type: 'string', description: 'Issue URL' },
      { key: 'status', type: 'string', description: 'Creation status' },
    ],
    updateIssue: [
      { key: 'issueNumber', type: 'number', description: 'Updated issue number' },
      { key: 'status', type: 'string', description: 'Update status' },
      { key: 'success', type: 'boolean', description: 'Whether update succeeded' },
    ],
    listPullRequests: [
      { key: 'pullRequests', type: 'array', description: 'Array of pull requests' },
      { key: 'count', type: 'number', description: 'Number of pull requests' },
    ],
    getPullRequest: [
      { key: 'prNumber', type: 'number', description: 'PR number' },
      { key: 'title', type: 'string', description: 'PR title' },
      { key: 'state', type: 'string', description: 'PR state' },
      { key: 'url', type: 'string', description: 'PR URL' },
    ],
    createPullRequest: [
      { key: 'prNumber', type: 'number', description: 'Created PR number' },
      { key: 'id', type: 'string', description: 'PR ID' },
      { key: 'url', type: 'string', description: 'PR URL' },
      { key: 'status', type: 'string', description: 'Creation status' },
    ],
    mergePullRequest: [
      { key: 'merged', type: 'boolean', description: 'Whether merge succeeded' },
      { key: 'mergeCommitSha', type: 'string', description: 'Merge commit SHA' },
      { key: 'status', type: 'string', description: 'Merge status' },
    ],
    listCommits: [
      { key: 'commits', type: 'array', description: 'Array of commits' },
      { key: 'count', type: 'number', description: 'Number of commits' },
    ],
    getCommit: [
      { key: 'sha', type: 'string', description: 'Commit SHA' },
      { key: 'message', type: 'string', description: 'Commit message' },
      { key: 'author', type: 'string', description: 'Commit author' },
      { key: 'url', type: 'string', description: 'Commit URL' },
    ],
    listBranches: [
      { key: 'branches', type: 'array', description: 'Array of branches' },
      { key: 'count', type: 'number', description: 'Number of branches' },
    ],
    createBranch: [
      { key: 'branchName', type: 'string', description: 'Created branch name' },
      { key: 'status', type: 'string', description: 'Creation status' },
    ],
    deleteBranch: [
      { key: 'status', type: 'string', description: 'Deletion status' },
      { key: 'success', type: 'boolean', description: 'Whether deletion succeeded' },
    ],
    listComments: [
      { key: 'comments', type: 'array', description: 'Array of comments' },
      { key: 'count', type: 'number', description: 'Number of comments' },
    ],
    createComment: [
      { key: 'id', type: 'string', description: 'Comment ID' },
      { key: 'url', type: 'string', description: 'Comment URL' },
      { key: 'status', type: 'string', description: 'Creation status' },
    ],
    deleteComment: [
      { key: 'status', type: 'string', description: 'Deletion status' },
      { key: 'success', type: 'boolean', description: 'Whether deletion succeeded' },
    ],
  },
  requiredInputs: [
    {
      key: 'operation',
      label: 'Operation',
      type: 'string',
      required: true,
      description: 'GitHub operation to perform',
      example: 'listUserRepos',
    },
  ],
  outputSchema: [
    {
      key: 'data',
      type: 'any',
      description: 'Result data from GitHub API',
      example: { repositories: [], count: 0 },
    },
    {
      key: 'status',
      type: 'string',
      description: 'Operation status (success/error)',
      example: 'success',
    },
    {
      key: 'message',
      type: 'string',
      description: 'Status message',
      example: 'Found 2 repositories',
    },
  ],
};
