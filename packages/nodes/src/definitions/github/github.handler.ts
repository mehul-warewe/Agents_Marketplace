import axios from 'axios';
import type { ToolHandler, ToolContext } from '../../types.js';

export const githubHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;

  const operation = render(config.operation || 'listUserRepos');
  const token = credentials?.accessToken || credentials?.apiKey;

  if (!token) {
    throw new Error('GitHub node requires a valid Personal Access Token or OAuth credential.');
  }

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
    // Repository operations
    if (operation === 'listUserRepos') {
      const owner = render(config.owner || '');
      url = `${baseUrl}/users/${owner}/repos`;
    } else if (operation === 'listOrgRepos') {
      const owner = render(config.owner || '');
      url = `${baseUrl}/orgs/${owner}/repos`;
    } else if (operation === 'listRepos') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      url = `${baseUrl}/repos/${owner}/${repo}`;
    } else if (operation === 'getRepo') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      url = `${baseUrl}/repos/${owner}/${repo}`;
    } else if (operation === 'createRepo') {
      const name = render(config.name || '');
      const description = render(config.description || '');
      const isPrivate = render(config.private || 'false') === 'true';
      url = `${baseUrl}/user/repos`;
      method = 'post';
      data = { name, description, private: isPrivate };
    } else if (operation === 'deleteRepo') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      url = `${baseUrl}/repos/${owner}/${repo}`;
      method = 'delete';

    // Issues operations
    } else if (operation === 'listIssues') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const state = render(config.state || 'open');
      url = `${baseUrl}/repos/${owner}/${repo}/issues`;
      if (state) url += `?state=${state}`;
    } else if (operation === 'getIssue') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const issueNumber = render(config.issueNumber || '');
      url = `${baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}`;
    } else if (operation === 'createIssue') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const title = render(config.title || '');
      const body = render(config.body || '');
      const labels = render(config.labels || '');
      const assignees = render(config.assignees || '');
      const milestone = render(config.milestone || '');
      url = `${baseUrl}/repos/${owner}/${repo}/issues`;
      method = 'post';
      data = { title, body };
      if (labels) data.labels = labels.split(',').map(l => l.trim());
      if (assignees) data.assignees = assignees.split(',').map(a => a.trim());
      if (milestone) data.milestone = parseInt(milestone, 10);
    } else if (operation === 'updateIssue') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const issueNumber = render(config.issueNumber || '');
      const assignees = render(config.assignees || '');
      url = `${baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}`;
      method = 'patch';
      data = {};
      if (config.state) data.state = render(config.state);
      if (config.title) data.title = render(config.title);
      if (config.body) data.body = render(config.body);
      if (assignees) data.assignees = assignees.split(',').map(a => a.trim());
    } else if (operation === 'closeIssue') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const issueNumber = render(config.issueNumber || '');
      url = `${baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}`;
      method = 'patch';
      data = { state: 'closed' };
    } else if (operation === 'reopenIssue') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const issueNumber = render(config.issueNumber || '');
      url = `${baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}`;
      method = 'patch';
      data = { state: 'open' };
    } else if (operation === 'addLabel') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const issueNumber = render(config.issueNumber || '');
      const labels = render(config.labels || '').split(',').map(l => l.trim());
      url = `${baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}/labels`;
      method = 'post';
      data = { labels };
    } else if (operation === 'removeLabel') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const issueNumber = render(config.issueNumber || '');
      const labelStr = render(config.labels || '').split(',');
      const label = (labelStr[0] || '').trim();
      url = `${baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}/labels/${encodeURIComponent(label)}`;
      method = 'delete';

    // Pull Request operations
    } else if (operation === 'listPullRequests') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const state = render(config.state || 'open');
      url = `${baseUrl}/repos/${owner}/${repo}/pulls`;
      if (state) url += `?state=${state}`;
    } else if (operation === 'getPullRequest') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const prNumber = render(config.prNumber || '');
      url = `${baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}`;
    } else if (operation === 'createPullRequest') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const title = render(config.title || '');
      const head = render(config.head || '');
      const base = render(config.base || 'main');
      const body = render(config.body || '');
      url = `${baseUrl}/repos/${owner}/${repo}/pulls`;
      method = 'post';
      data = { title, head, base, body };
    } else if (operation === 'updatePullRequest') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const prNumber = render(config.prNumber || '');
      url = `${baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}`;
      method = 'patch';
      data = {};
      if (config.state) data.state = render(config.state);
      if (config.title) data.title = render(config.title);
      if (config.body) data.body = render(config.body);
    } else if (operation === 'mergePullRequest') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const prNumber = render(config.prNumber || '');
      const mergeMethod = render(config.mergeMethod || 'merge');
      url = `${baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}/merge`;
      method = 'put';
      data = { merge_method: mergeMethod };

    // Commit operations
    } else if (operation === 'listCommits') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const branch = render(config.branch || 'main');
      url = `${baseUrl}/repos/${owner}/${repo}/commits?sha=${branch}`;
    } else if (operation === 'getCommit') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const sha = render(config.sha || '');
      url = `${baseUrl}/repos/${owner}/${repo}/commits/${sha}`;

    // Branch operations
    } else if (operation === 'listBranches') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      url = `${baseUrl}/repos/${owner}/${repo}/branches`;
    } else if (operation === 'createBranch') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const branchName = render(config.branchName || '');
      const fromBranch = render(config.fromBranch || 'main');

      // First get the SHA of the source branch
      const refRes = await axios.get(
        `${baseUrl}/repos/${owner}/${repo}/git/refs/heads/${fromBranch}`,
        { headers }
      );
      const sha = refRes.data.object.sha;

      url = `${baseUrl}/repos/${owner}/${repo}/git/refs`;
      method = 'post';
      data = { ref: `refs/heads/${branchName}`, sha };
    } else if (operation === 'deleteBranch') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const branchName = render(config.branchName || '');
      url = `${baseUrl}/repos/${owner}/${repo}/git/refs/heads/${branchName}`;
      method = 'delete';

    // Comment operations
    } else if (operation === 'listComments') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const issueNumber = render(config.issueNumber || '');
      url = `${baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}/comments`;
    } else if (operation === 'createComment') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const issueNumber = render(config.issueNumber || '');
      const body = render(config.body || '');
      url = `${baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}/comments`;
      method = 'post';
      data = { body };
    } else if (operation === 'updateComment') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const commentId = render(config.commentId || '');
      const body = render(config.body || '');
      url = `${baseUrl}/repos/${owner}/${repo}/issues/comments/${commentId}`;
      method = 'patch';
      data = { body };
    } else if (operation === 'deleteComment') {
      const owner = render(config.owner || '');
      const repo = render(config.repo || '');
      const commentId = render(config.commentId || '');
      url = `${baseUrl}/repos/${owner}/${repo}/issues/comments/${commentId}`;
      method = 'delete';
    } else {
      throw new Error(`Unsupported GitHub operation: ${operation}`);
    }

    // console.log(`[Github] ${operation} - ${method.toUpperCase()} ${url}`);

    const res = await axios({ method, url, data, headers });
    return { status: 'success', data: res.data };
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message;
    throw new Error(`[GitHub Error] ${msg}`);
  }
};
