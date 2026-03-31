import axios from 'axios';
import type { ToolHandler, ToolContext } from '../../types.js';

export const redditHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;

  const operation = render(config.operation || 'getMe');
  const token = credentials?.accessToken || credentials?.apiKey;

  if (!token) {
    throw new Error('Reddit node requires a valid OAuth credential.');
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'Aether-Worker/1.0.0', // Reddit requires a specific User-Agent
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const baseUrl = 'https://oauth.reddit.com';

  try {
    if (operation === 'getMe') {
      const res = await axios.get(`${baseUrl}/api/v1/me`, { headers });
      return { status: 'success', data: res.data };
    }

    if (operation === 'submitPost') {
      const sr = render(config.subreddit || '');
      const title = render(config.title || '');
      const kind = render(config.kind || 'self');
      const text = render(config.text || '');
      const url = render(config.url || '');

      const params = new URLSearchParams({
        sr,
        title,
        kind,
        api_type: 'json',
      });

      if (kind === 'self' && text) params.append('text', text);
      if (kind === 'link' && url) params.append('url', url);

      const res = await axios.post(`${baseUrl}/api/submit`, params, { headers });
      
      const resData = res.data?.json?.data;
      if (!resData && res.data?.json?.errors?.length > 0) {
        throw new Error(`Reddit API Error: ${JSON.stringify(res.data.json.errors)}`);
      }

      return { status: 'success', data: resData };
    }

    if (operation === 'createComment') {
      let thing_id = render(config.parentId || '');
      const text = render(config.text || '');

      // Ensure proper prefix (t3_ for link, t1_ for comment)
      // If none, assume it's a post (t3_)
      if (!thing_id.startsWith('t1_') && !thing_id.startsWith('t3_')) {
        thing_id = `t3_${thing_id}`;
      }

      const params = new URLSearchParams({
        thing_id,
        text,
        api_type: 'json',
      });

      const res = await axios.post(`${baseUrl}/api/comment`, params, { headers });
      const resData = res.data?.json?.data?.things?.[0]?.data;
      
      if (!resData && res.data?.json?.errors?.length > 0) {
        throw new Error(`Reddit API Error: ${JSON.stringify(res.data.json.errors)}`);
      }

      return { status: 'success', data: resData };
    }

    if (operation === 'listPosts') {
      const sr = render(config.subreddit || 'all');
      const category = render(config.category || 'hot');
      const limit = parseInt(render(config.limit || '10'), 10);

      const res = await axios.get(`${baseUrl}/r/${sr}/${category}`, {
        headers,
        params: { limit },
      });

      const items = res.data.data.children.map((child: any) => child.data);
      return { status: 'success', data: items };
    }

    throw new Error(`Unsupported Reddit operation: ${operation}`);
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message;
    throw new Error(`[Reddit Error] ${msg}`);
  }
};
