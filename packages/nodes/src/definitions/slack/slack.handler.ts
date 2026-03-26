import axios from 'axios';
import type { ToolHandler, ToolContext } from '../../types.js';

export const slackHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;

  const operation = render(config.operation || 'send');
  const token = credentials?.botToken || credentials?.accessToken;

  if (!token) {
    throw new Error('Slack node requires a Bot Token or OAuth credential.');
  }

  const baseUrl = 'https://slack.com/api';
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    let result: any;

    // Message operations
    if (operation === 'send') {
      const channelId = render(config.channelId || '');
      const text = render(config.text || '');
      const blocks = config.blocks ? JSON.parse(render(config.blocks)) : undefined;
      const threadTs = config.threadTs ? render(config.threadTs) : undefined;

      result = await axios.post(`${baseUrl}/chat.postMessage`, {
        channel: channelId,
        text,
        blocks,
        thread_ts: threadTs
      }, { headers });

    } else if (operation === 'sendDirect') {
      const userId = render(config.userId || '');
      const text = render(config.text || '');
      result = await axios.post(`${baseUrl}/chat.postMessage`, {
        channel: userId,
        text
      }, { headers });

    } else if (operation === 'sendChannel') {
      const channelId = render(config.channelId || '');
      const text = render(config.text || '');
      result = await axios.post(`${baseUrl}/chat.postMessage`, {
        channel: channelId,
        text
      }, { headers });

    } else if (operation === 'sendThread') {
      const channelId = render(config.channelId || '');
      const threadTs = render(config.threadTs || '');
      const text = render(config.text || '');
      result = await axios.post(`${baseUrl}/chat.postMessage`, {
        channel: channelId,
        thread_ts: threadTs,
        text
      }, { headers });

    } else if (operation === 'update') {
      const channelId = render(config.channelId || '');
      const ts = render(config.ts || '');
      const text = render(config.text || '');
      result = await axios.post(`${baseUrl}/chat.update`, {
        channel: channelId,
        ts,
        text
      }, { headers });

    } else if (operation === 'delete') {
      const channelId = render(config.channelId || '');
      const ts = render(config.ts || '');
      result = await axios.post(`${baseUrl}/chat.delete`, {
        channel: channelId,
        ts
      }, { headers });

    } else if (operation === 'get') {
      const channelId = render(config.channelId || '');
      const limit = render(config.limit || '20');
      result = await axios.get(`${baseUrl}/conversations.history`, {
        params: { channel: channelId, limit },
        headers
      });

    } else if (operation === 'search') {
      const query = render(config.query || '');
      const count = render(config.count || '10');
      result = await axios.get(`${baseUrl}/search.messages`, {
        params: { query, count },
        headers
      });

    // Channel operations
    } else if (operation === 'list') {
      const types = render(config.types || 'public_channel,private_channel');
      const limit = render(config.limit || '20');
      result = await axios.get(`${baseUrl}/conversations.list`, {
        params: { types, limit },
        headers
      });

    } else if (operation === 'create') {
      const name = render(config.name || '');
      const isPrivate = render(config.isPrivate || 'false') === 'true';
      result = await axios.post(`${baseUrl}/conversations.create`, {
        name,
        is_private: isPrivate
      }, { headers });

    } else if (operation === 'archive') {
      const channelId = render(config.channelId || '');
      result = await axios.post(`${baseUrl}/conversations.archive`, {
        channel: channelId
      }, { headers });

    } else if (operation === 'unarchive') {
      const channelId = render(config.channelId || '');
      result = await axios.post(`${baseUrl}/conversations.unarchive`, {
        channel: channelId
      }, { headers });

    } else if (operation === 'join') {
      const channelId = render(config.channelId || '');
      result = await axios.post(`${baseUrl}/conversations.join`, {
        channel: channelId
      }, { headers });

    } else if (operation === 'leave') {
      const channelId = render(config.channelId || '');
      result = await axios.post(`${baseUrl}/conversations.leave`, {
        channel: channelId
      }, { headers });

    } else if (operation === 'invite') {
      const channelId = render(config.channelId || '');
      const userIds = render(config.userIds || '').split(',').map(id => id.trim());
      result = await axios.post(`${baseUrl}/conversations.invite`, {
        channel: channelId,
        users: userIds.join(',')
      }, { headers });

    } else if (operation === 'remove') {
      const channelId = render(config.channelId || '');
      const userId = render(config.userId || '');
      result = await axios.post(`${baseUrl}/conversations.kick`, {
        channel: channelId,
        user: userId
      }, { headers });

    } else if (operation === 'setTopic') {
      const channelId = render(config.channelId || '');
      const topic = render(config.topic || '');
      result = await axios.post(`${baseUrl}/conversations.setTopic`, {
        channel: channelId,
        topic
      }, { headers });

    } else if (operation === 'setDescription') {
      const channelId = render(config.channelId || '');
      const description = render(config.description || '');
      result = await axios.post(`${baseUrl}/conversations.setPurpose`, {
        channel: channelId,
        purpose: description
      }, { headers });

    // Reaction operations
    } else if (operation === 'add') {
      const channelId = render(config.channelId || '');
      const ts = render(config.ts || '');
      const emoji = render(config.emoji || '');
      result = await axios.post(`${baseUrl}/reactions.add`, {
        channel: channelId,
        timestamp: ts,
        name: emoji
      }, { headers });

    } else if (operation === 'removeReaction') {
      const channelId = render(config.channelId || '');
      const ts = render(config.ts || '');
      const emoji = render(config.emoji || '');
      result = await axios.post(`${baseUrl}/reactions.remove`, {
        channel: channelId,
        timestamp: ts,
        name: emoji
      }, { headers });

    } else if (operation === 'getReactions') {
      const channelId = render(config.channelId || '');
      const ts = render(config.ts || '');
      result = await axios.get(`${baseUrl}/reactions.get`, {
        params: { channel: channelId, timestamp: ts },
        headers
      });

    // User operations
    } else if (operation === 'getUserInfo') {
      const userId = render(config.userId || '');
      result = await axios.get(`${baseUrl}/users.info`, {
        params: { user: userId },
        headers
      });

    } else if (operation === 'updateProfile') {
      const userId = render(config.userId || '');
      const profile = config.profile ? JSON.parse(render(config.profile)) : {};
      result = await axios.post(`${baseUrl}/users.profile.set`, {
        user: userId,
        profile
      }, { headers });

    } else if (operation === 'getStatus') {
      const userId = render(config.userId || '');
      result = await axios.get(`${baseUrl}/users.info`, {
        params: { user: userId },
        headers
      });

    // File operations
    } else if (operation === 'upload') {
      const channels = render(config.channels || '').split(',').map(c => c.trim());
      const filename = render(config.filename || '');
      const title = render(config.title || '');
      const fileUrl = render(config.file || '');

      // Download file from URL or use base64 data
      let fileContent: any;
      if (fileUrl.startsWith('http')) {
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        fileContent = response.data;
      } else {
        fileContent = Buffer.from(fileUrl, 'base64');
      }

      result = await axios.post(`${baseUrl}/files.upload`, {
        channels: channels.join(','),
        filename,
        title,
        file: fileContent
      }, { headers });

    } else if (operation === 'listFiles') {
      const userId = render(config.userId || '');
      const channelId = render(config.channelId || '');
      const count = render(config.count || '10');

      const params: any = { count };
      if (userId) params.user = userId;
      if (channelId) params.channel = channelId;

      result = await axios.get(`${baseUrl}/files.list`, {
        params,
        headers
      });

    } else if (operation === 'deleteFile') {
      const fileId = render(config.fileId || '');
      result = await axios.post(`${baseUrl}/files.delete`, {
        file: fileId
      }, { headers });

    } else if (operation === 'getFileInfo') {
      const fileId = render(config.fileId || '');
      result = await axios.get(`${baseUrl}/files.info`, {
        params: { file: fileId },
        headers
      });

    // Thread operations
    } else if (operation === 'listThreads') {
      const channelId = render(config.channelId || '');
      result = await axios.get(`${baseUrl}/conversations.history`, {
        params: { channel: channelId },
        headers
      });

    } else if (operation === 'getThread') {
      const channelId = render(config.channelId || '');
      const ts = render(config.ts || '');
      result = await axios.get(`${baseUrl}/conversations.replies`, {
        params: { channel: channelId, ts },
        headers
      });

    } else if (operation === 'markRead') {
      const channelId = render(config.channelId || '');
      const ts = render(config.ts || '');
      result = await axios.post(`${baseUrl}/conversations.mark`, {
        channel: channelId,
        ts
      }, { headers });

    } else {
      throw new Error(`Unsupported Slack operation: ${operation}`);
    }

    if (!result.data.ok) {
      throw new Error(result.data.error || 'Slack API error');
    }

    return { status: 'success', data: result.data };
  } catch (err: any) {
    const msg = err.response?.data?.error || err.message;
    throw new Error(`[Slack Error] ${msg}`);
  }
};
