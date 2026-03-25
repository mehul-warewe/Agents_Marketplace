import axios from 'axios';
import type { ToolHandler, ToolContext } from '../../types.js';

export const slackHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;
  
  const activeOp = (config.operations && config.operations[0]) || config;
  const resource = activeOp.resource || config.resource || 'message';
  const operation = activeOp.op || activeOp.operation || 'post';
  
  const token = credentials?.botToken || credentials?.accessToken;
  if (!token) {
    throw new Error('Slack node requires a Bot Token or OAuth credential.');
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const baseUrl = 'https://slack.com/api';

  try {
    switch (resource) {
      case 'message':
        if (operation === 'post') {
          const res = await axios.post(`${baseUrl}/chat.postMessage`, {
            channel: render(activeOp.channelId || ''),
            text: render(activeOp.text || ''),
          }, { headers });
          if (!res.data.ok) throw new Error(res.data.error);
          return res.data;
        }
        break;

      case 'channel':
        if (operation === 'list') {
          const res = await axios.get(`${baseUrl}/conversations.list`, { 
            params: { types: render(activeOp.types || 'public_channel,private_channel') },
            headers 
          });
          if (!res.data.ok) throw new Error(res.data.error);
          return res.data;
        }
        if (operation === 'info') {
          const res = await axios.get(`${baseUrl}/conversations.info`, { 
            params: { channel: render(activeOp.channelId || '') },
            headers 
          });
          if (!res.data.ok) throw new Error(res.data.error);
          return res.data;
        }
        break;
    }
    
    throw new Error(`Unsupported Slack operation: ${operation} for ${resource}`);
  } catch (err: any) {
    const msg = err.response?.data?.error || err.message;
    throw new Error(`[Slack Error] ${msg}`);
  }
};
