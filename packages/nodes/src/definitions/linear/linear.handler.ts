import axios from 'axios';
import type { ToolHandler, ToolContext } from '../../types.js';

export const linearHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;
  const operation = config.operation;
  const apiKey = credentials?.apiKey;

  if (!apiKey) throw new Error('Linear node requires a valid API key.');

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const graphqlUrl = 'https://api.linear.app/graphql';

  try {
    switch (operation) {
      case 'listIssues': {
        const first = parseInt(render(config.first || '50'), 10) || 50;
        const teamId = render(config.teamId || '');
        const status = render(config.status || '');

        let filterStr = '';
        if (teamId) filterStr += `team: { id: { eq: "${teamId}" } }`;
        if (status) filterStr += (filterStr ? ', ' : '') + `state: { name: { eq: "${status}" } }`;

        const query = `
          query {
            issues(first: ${first}${filterStr ? `, filter: { ${filterStr} }` : ''}) {
              edges { node { id number title state { name } priority assignee { id name email } team { id name } } }
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query }, { headers });
        return { success: true, issues: res.data.data?.issues?.edges || [] };
      }

      case 'getIssue': {
        const issueId = render(config.issueId);
        const query = `
          query {
            issue(id: "${issueId}") {
              id number title description state { name } priority assignee { id name email } team { id name } createdAt updatedAt
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query }, { headers });
        return { success: true, issue: res.data.data?.issue };
      }

      case 'createIssue': {
        const teamId = render(config.teamId);
        const title = render(config.title);
        const description = render(config.description || '');
        const priority = parseInt(render(config.priority || '0'), 10) || 0;

        const mutation = `
          mutation {
            issueCreate(input: { teamId: "${teamId}", title: "${title.replace(/"/g, '\\"')}", description: "${description.replace(/"/g, '\\"')}", priority: ${priority} }) {
              success issue { id number title }
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: true, issue: res.data.data?.issueCreate?.issue };
      }

      case 'updateIssue': {
        const issueId = render(config.issueId);
        const updates: any = {};
        if (config.title) updates.title = render(config.title);
        if (config.description) updates.description = render(config.description);
        if (config.state) updates.stateId = render(config.state);

        const updateStr = Object.entries(updates).map(([k, v]) =>
          `${k}: "${typeof v === 'string' ? v.replace(/"/g, '\\"') : v}"`
        ).join(', ');

        const mutation = `
          mutation {
            issueUpdate(id: "${issueId}", input: { ${updateStr} }) {
              success issue { id title }
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: true, issue: res.data.data?.issueUpdate?.issue };
      }

      case 'deleteIssue': {
        const issueId = render(config.issueId);
        const mutation = `mutation { issueDelete(id: "${issueId}") { success } }`;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: res.data.data?.issueDelete?.success };
      }

      case 'archiveIssue': {
        const issueId = render(config.issueId);
        const mutation = `mutation { issueArchive(id: "${issueId}") { success } }`;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: res.data.data?.issueArchive?.success };
      }

      case 'unarchiveIssue': {
        const issueId = render(config.issueId);
        const mutation = `mutation { issueUnarchive(id: "${issueId}") { success } }`;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: res.data.data?.issueUnarchive?.success };
      }

      case 'assignIssue': {
        const issueId = render(config.issueId);
        const userId = render(config.userId);
        const mutation = `mutation { issueUpdate(id: "${issueId}", input: { assigneeId: "${userId}" }) { success issue { id } } }`;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: true, issueId, assignedTo: userId };
      }

      case 'unassignIssue': {
        const issueId = render(config.issueId);
        const mutation = `mutation { issueUpdate(id: "${issueId}", input: { assigneeId: null }) { success issue { id } } }`;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: true, issueId, unassigned: true };
      }

      case 'changeStatus': {
        const issueId = render(config.issueId);
        const state = render(config.state);
        const mutation = `mutation { issueUpdate(id: "${issueId}", input: { state: "${state}" }) { success issue { id state { name } } } }`;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: true, issueId, newState: state };
      }

      case 'changePriority': {
        const issueId = render(config.issueId);
        const priority = parseInt(render(config.priority), 10) || 0;
        const mutation = `mutation { issueUpdate(id: "${issueId}", input: { priority: ${priority} }) { success issue { id priority } } }`;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: true, issueId, priority };
      }

      case 'addLabel': {
        const issueId = render(config.issueId);
        const labelId = render(config.labelId);
        const mutation = `mutation { issueAddLabel(id: "${issueId}", labelId: "${labelId}") { success issue { id labels { edges { node { id name } } } } } }`;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: true, issueId, labelAdded: labelId };
      }

      case 'removeLabel': {
        const issueId = render(config.issueId);
        const labelId = render(config.labelId);
        const mutation = `mutation { issueRemoveLabel(id: "${issueId}", labelId: "${labelId}") { success issue { id } } }`;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: true, issueId, labelRemoved: labelId };
      }

      case 'addToProject': {
        const issueId = render(config.issueId);
        const projectId = render(config.projectId);
        const mutation = `mutation { issueAddToProject(id: "${issueId}", projectId: "${projectId}") { success issue { id } } }`;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: true, issueId, addedToProject: projectId };
      }

      case 'removeFromProject': {
        const issueId = render(config.issueId);
        const projectId = render(config.projectId);
        const mutation = `mutation { issueRemoveFromProject(id: "${issueId}", projectId: "${projectId}") { success issue { id } } }`;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: true, issueId, removedFromProject: projectId };
      }

      case 'listComments': {
        const issueId = render(config.issueId);
        const query = `
          query {
            issue(id: "${issueId}") {
              comments(first: 50) {
                edges { node { id body createdAt user { id name email } } }
              }
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query }, { headers });
        return { success: true, comments: res.data.data?.issue?.comments?.edges || [] };
      }

      case 'createComment': {
        const issueId = render(config.issueId);
        const body = render(config.body);
        const mutation = `
          mutation {
            commentCreate(input: { issueId: "${issueId}", body: "${body.replace(/"/g, '\\"')}" }) {
              success comment { id body createdAt }
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: true, comment: res.data.data?.commentCreate?.comment };
      }

      case 'updateComment': {
        const commentId = render(config.commentId);
        const body = render(config.body);
        const mutation = `
          mutation {
            commentUpdate(id: "${commentId}", input: { body: "${body.replace(/"/g, '\\"')}" }) {
              success comment { id body }
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: true, comment: res.data.data?.commentUpdate?.comment };
      }

      case 'deleteComment': {
        const commentId = render(config.commentId);
        const mutation = `mutation { commentDelete(id: "${commentId}") { success } }`;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: res.data.data?.commentDelete?.success };
      }

      case 'listProjects': {
        const first = parseInt(render(config.first || '50'), 10) || 50;
        const query = `
          query {
            projects(first: ${first}) {
              edges { node { id name description state } }
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query }, { headers });
        return { success: true, projects: res.data.data?.projects?.edges || [] };
      }

      case 'getProject': {
        const projectId = render(config.projectId);
        const query = `
          query {
            project(id: "${projectId}") {
              id name description state createdAt updatedAt
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query }, { headers });
        return { success: true, project: res.data.data?.project };
      }

      case 'createProject': {
        const name = render(config.name);
        const description = render(config.description || '');
        const mutation = `
          mutation {
            projectCreate(input: { name: "${name.replace(/"/g, '\\"')}", description: "${description.replace(/"/g, '\\"')}" }) {
              success project { id name }
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: true, project: res.data.data?.projectCreate?.project };
      }

      case 'updateProject': {
        const projectId = render(config.projectId);
        const updates: any = {};
        if (config.name) updates.name = render(config.name);
        if (config.description) updates.description = render(config.description);

        const updateStr = Object.entries(updates).map(([k, v]) =>
          `${k}: "${typeof v === 'string' ? v.replace(/"/g, '\\"') : v}"`
        ).join(', ');

        const mutation = `
          mutation {
            projectUpdate(id: "${projectId}", input: { ${updateStr} }) {
              success project { id name }
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: true, project: res.data.data?.projectUpdate?.project };
      }

      case 'deleteProject': {
        const projectId = render(config.projectId);
        const mutation = `mutation { projectDelete(id: "${projectId}") { success } }`;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: res.data.data?.projectDelete?.success };
      }

      case 'listTeams': {
        const query = `
          query {
            teams(first: 50) {
              edges { node { id name key } }
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query }, { headers });
        return { success: true, teams: res.data.data?.teams?.edges || [] };
      }

      case 'getTeam': {
        const teamId = render(config.teamId);
        const query = `
          query {
            team(id: "${teamId}") {
              id name key members(first: 50) { edges { node { id name email } } }
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query }, { headers });
        return { success: true, team: res.data.data?.team };
      }

      case 'createTeam': {
        const name = render(config.name);
        const key = render(config.key);
        const mutation = `
          mutation {
            teamCreate(input: { name: "${name}", key: "${key}" }) {
              success team { id name key }
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: true, team: res.data.data?.teamCreate?.team };
      }

      case 'listMembers': {
        const teamId = render(config.teamId);
        const query = `
          query {
            team(id: "${teamId}") {
              members(first: 50) {
                edges { node { id name email } }
              }
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query }, { headers });
        return { success: true, members: res.data.data?.team?.members?.edges || [] };
      }

      case 'listCycles': {
        const teamId = render(config.teamId || '');
        const query = `
          query {
            cycles(first: 50${teamId ? `, filter: { team: { id: { eq: "${teamId}" } } }` : ''}) {
              edges { node { id name startedAt endsAt number } }
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query }, { headers });
        return { success: true, cycles: res.data.data?.cycles?.edges || [] };
      }

      case 'getCycle': {
        const cycleId = render(config.cycleId);
        const query = `
          query {
            cycle(id: "${cycleId}") {
              id name number startedAt endsAt issues(first: 50) { edges { node { id number title } } }
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query }, { headers });
        return { success: true, cycle: res.data.data?.cycle };
      }

      case 'createCycle': {
        const teamId = render(config.teamId);
        const name = render(config.name);
        const startDate = render(config.startDate);
        const endDate = render(config.endDate);
        const mutation = `
          mutation {
            cycleCreate(input: { teamId: "${teamId}", name: "${name}", startsAt: "${startDate}", endsAt: "${endDate}" }) {
              success cycle { id name }
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: true, cycle: res.data.data?.cycleCreate?.cycle };
      }

      case 'updateCycle': {
        const cycleId = render(config.cycleId);
        const updates: any = {};
        if (config.name) updates.name = render(config.name);
        if (config.startDate) updates.startsAt = render(config.startDate);
        if (config.endDate) updates.endsAt = render(config.endDate);

        const updateStr = Object.entries(updates).map(([k, v]) =>
          `${k}: "${v}"`
        ).join(', ');

        const mutation = `
          mutation {
            cycleUpdate(id: "${cycleId}", input: { ${updateStr} }) {
              success cycle { id name }
            }
          }
        `;
        const res = await axios.post(graphqlUrl, { query: mutation }, { headers });
        return { success: true, cycle: res.data.data?.cycleUpdate?.cycle };
      }

      default:
        throw new Error(`Unknown Linear operation: ${operation}`);
    }
  } catch (err: any) {
    const msg = err.response?.data?.errors?.[0]?.message || err.message;
    throw new Error(`[Linear Error] ${msg}`);
  }
};
