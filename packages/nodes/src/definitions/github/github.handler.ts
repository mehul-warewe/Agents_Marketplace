import axios from 'axios';
import type { ToolHandler, ToolContext } from '../../types.js';

export const githubHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;
  
  // Support both flat config and multi-operation format
  const activeOp = (config.operations && config.operations[0]) || config;
  const resource = activeOp.resource || config.resource || 'issue';
  const operation = activeOp.op || activeOp.operation || 'list';
  
  const token = credentials?.accessToken;
  if (!token) {
    throw new Error('GitHub node requires a Personal Access Token. Please select a credential in the "Settings" tab.');
  }

  const owner = render(activeOp.owner || '');
  const repo = render(activeOp.repo || '');
  const issueNumber = render(activeOp.issueNumber || '');
  
  console.log(`[GitHub Node] Handler called. Parsed payload:`, { resource, operation, owner, repo, issueNumber, title: activeOp.title, body: activeOp.body });

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'warewe-agent-worker'
  };

  const baseUrl = 'https://api.github.com';
  let url = '';
  let method = 'get';
  let data: any = undefined;

  try {
    switch (resource) {
      case 'issue':
        if (operation === 'list') {
          url = `${baseUrl}/repos/${owner}/${repo}/issues`;
        } else if (operation === 'get') {
          url = `${baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}`;
        } else if (operation === 'create') {
          url = `${baseUrl}/repos/${owner}/${repo}/issues`;
          method = 'post';
          data = { title: render(activeOp.title || 'Untitled'), body: render(activeOp.body || '') };
        } else if (operation === 'update') {
          url = `${baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}`;
          method = 'patch';
          data = { title: render(activeOp.title || ''), body: render(activeOp.body || '') };
          if (activeOp.state) data.state = activeOp.state;
        }
        break;
      case 'pullRequest':
        url = `${baseUrl}/repos/${owner}/${repo}/pulls`;
        if (operation === 'get') url += `/${issueNumber}`;
        break;
      case 'repository':
        if (operation === 'list') {
          url = owner ? `${baseUrl}/users/${owner}/repos` : `${baseUrl}/user/repos`;
        } else if (operation === 'get') {
          url = `${baseUrl}/repos/${owner}/${repo}`;
        } else if (operation === 'create') {
          url = `${baseUrl}/user/repos`; // Create in authenticated user's account
          method = 'post';
          data = { name: repo || render(activeOp.title || 'new-repo'), description: render(activeOp.body || ''), private: true };
        }
        break;
    }

    if (!url) {
      throw new Error(`Unsupported operation: ${operation} for resource: ${resource}`);
    }

    console.log(`[GitHub Node] Calling API - Method: ${method}, URL: ${url}`);

    const res = await axios({ method, url, data, headers });
    return res.data;
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message;
    throw new Error(`[GitHub Error] ${msg}`);
  }
};
