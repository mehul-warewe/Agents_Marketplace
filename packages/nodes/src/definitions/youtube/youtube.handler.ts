import axios from 'axios';
import type { ToolHandler, ToolContext } from '../../types.js';

function resolveId(val: string): string {
    if (!val || typeof val !== 'string') return val;
    if (!val.includes('/')) return val;
    const segments = val.split('/');
    const dIdx = segments.indexOf('d');
    if (dIdx !== -1 && segments[dIdx + 1]) return segments[dIdx + 1]!;
    return segments.pop() || val;
}

export const youtubeHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;
  const operation = config.operation;
  const token = credentials?.accessToken;
  if (!token) throw new Error('YouTube node requires a valid Google OAuth2 credential.');

  const headers = { Authorization: `Bearer ${token}` };

  switch (operation) {
    case 'channel_stats': {
      const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: { part: 'statistics,snippet,contentDetails', mine: true },
        headers,
      });
      return { success: true, ...res.data.items?.[0] };
    }

    case 'list_my_videos': {
      const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;
      const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: { part: 'snippet', forMine: true, type: 'video', maxResults, order: 'date' },
        headers,
      });
      return { success: true, videos: res.data.items || [] };
    }

    case 'video_stats': {
      const videoId = resolveId(render(config.videoId));
      const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: { part: 'statistics,snippet', id: videoId },
        headers,
      });
      return { success: true, ...res.data.items?.[0] };
    }

    case 'analytics': {
      // Analytics requires specialized handling usually, but this is the simplified version
      const startDate = render(config.startDate);
      const endDate = render(config.endDate);
      return { error: 'YouTube Analytics logic is complex and requires specialized scopes. Not fully implemented in modular handler yet.', success: false };
    }

    default:
      throw new Error(`Unknown YouTube operation: ${operation}`);
  }
};
