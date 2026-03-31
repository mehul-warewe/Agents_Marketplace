import axios from 'axios';
import type { ToolHandler, ToolContext } from '../../types.js';

export const linkedinHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;

  const operation = render(config.operation || 'createPost');
  const token = credentials?.accessToken || credentials?.apiKey;

  if (!token) {
    throw new Error('LinkedIn node requires a valid OAuth credential.');
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
  };

  const baseUrl = 'https://api.linkedin.com/v2';

  try {
    if (operation === 'getMe') {
      const res = await axios.get(`${baseUrl}/me`, { headers });
      return { status: 'success', data: res.data };
    }

    if (operation === 'createPost') {
      const text = render(config.text || '');
      
      // 1. Get Member URN first
      const meRes = await axios.get(`${baseUrl}/me`, { headers });
      const memberUrn = `urn:li:person:${meRes.data.id}`;

      // 2. Simple Share (V2)
      // Note: LinkedIn is moving to /posts, but /ugcPosts is still widely used in n8n and works well for simple shares.
      // However, n8n uses /posts in their latest version. Let's try /posts as it's the modern API.
      
      const body = {
        author: memberUrn,
        commentary: text,
        visibility: 'PUBLIC',
        lifecycleState: 'PUBLISHED',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: []
        }
      };

      const res = await axios.post(`${baseUrl}/posts`, body, { headers });
      
      // If successful, returns 201 Created with Header x-linkedin-id
      const id = res.headers['x-linkedin-id'];
      
      return { 
        status: 'success', 
        id: id || 'created',
        data: res.data 
      };
    }

    throw new Error(`Unsupported LinkedIn operation: ${operation}`);
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message;
    throw new Error(`[LinkedIn Error] ${msg}`);
  }
};
