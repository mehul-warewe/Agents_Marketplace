import axios from 'axios';
import type { ToolHandler, ToolContext } from '../../types.js';

export const youtubeHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;
  const operation = config.operation;
  const token = credentials?.accessToken;
  if (!token) throw new Error('YouTube node requires a valid Google OAuth2 credential.');

  const headers = { Authorization: `Bearer ${token}` };

  try {
    let result: any;
    switch (operation) {
      case 'searchVideos': {
        const query = render(config.query);
        const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;
        const order = render(config.order || 'relevance');
        const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: { part: 'snippet', q: query, maxResults, order, type: 'video' },
          headers,
        });
        result = res.data;
        break;
      }

      case 'getVideo': {
        const videoId = render(config.videoId);
        const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: { part: 'snippet,statistics,contentDetails', id: videoId },
          headers,
        });
        result = res.data;
        break;
      }

      case 'listVideos': {
        const channelId = render(config.channelId);
        const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;
        const params: any = { part: 'snippet', maxResults, order: 'date' };
        if (channelId) params.channelId = channelId;
        const res = await axios.get('https://www.googleapis.com/youtube/v3/search', { params, headers });
        result = res.data;
        break;
      }

      case 'getVideoStats': {
        const videoId = render(config.videoId);
        const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: { part: 'statistics,snippet', id: videoId },
          headers,
        });
        result = res.data;
        break;
      }

      case 'getComments': {
        const videoId = render(config.videoId);
        const maxResults = parseInt(render(config.maxResults || '20'), 10) || 20;
        const res = await axios.get('https://www.googleapis.com/youtube/v3/commentThreads', {
          params: { part: 'snippet', videoId, maxResults, textFormat: 'plainText' },
          headers,
        });
        result = res.data;
        break;
      }

      case 'listPlaylists': {
        const channelId = render(config.channelId);
        const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;
        const params: any = { part: 'snippet,contentDetails', maxResults };
        if (channelId) params.channelId = channelId;
        else params.mine = true;
        const res = await axios.get('https://www.googleapis.com/youtube/v3/playlists', { params, headers });
        result = res.data;
        break;
      }

      case 'getPlaylist': {
        const playlistId = render(config.playlistId);
        const res = await axios.get('https://www.googleapis.com/youtube/v3/playlists', {
          params: { part: 'snippet,contentDetails', id: playlistId },
          headers,
        });
        result = res.data;
        break;
      }

      case 'createPlaylist': {
        const title = render(config.title);
        const description = render(config.description || '');
        const privacyStatus = render(config.privacyStatus || 'private');
        const res = await axios.post('https://www.googleapis.com/youtube/v3/playlists', {
          snippet: { title, description },
          status: { privacyStatus },
        }, { params: { part: 'snippet,status' }, headers });
        result = res.data;
        break;
      }

      case 'updatePlaylist': {
        const playlistId = render(config.playlistId);
        const updates: any = { id: playlistId };
        if (config.title) updates.snippet = { title: render(config.title) };
        if (config.description) {
          updates.snippet = updates.snippet || {};
          updates.snippet.description = render(config.description);
        }
        const res = await axios.put('https://www.googleapis.com/youtube/v3/playlists', updates, {
          params: { part: 'snippet' },
          headers,
        });
        result = res.data;
        break;
      }

      case 'deletePlaylist': {
        const playlistId = render(config.playlistId);
        await axios.delete('https://www.googleapis.com/youtube/v3/playlists', {
          params: { id: playlistId },
          headers,
        });
        result = { status: 'deleted' };
        break;
      }

      case 'addToPlaylist': {
        const playlistId = render(config.playlistId);
        const videoId = render(config.videoId);
        const res = await axios.post('https://www.googleapis.com/youtube/v3/playlistItems', {
          snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId } },
        }, { params: { part: 'snippet' }, headers });
        result = res.data;
        break;
      }

      case 'removeFromPlaylist': {
        const playlistItemId = render(config.playlistItemId);
        await axios.delete('https://www.googleapis.com/youtube/v3/playlistItems', {
          params: { id: playlistItemId },
          headers,
        });
        result = { status: 'removed' };
        break;
      }

      case 'getChannel': {
        const channelId = render(config.channelId || '');
        const forUsername = render(config.forUsername || '');
        const params: any = { part: 'snippet,statistics,contentDetails' };
        if (channelId) params.id = channelId;
        else if (forUsername) params.forUsername = forUsername;
        else params.mine = true;
        const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', { params, headers });
        result = res.data;
        break;
      }

      case 'listChannelVideos': {
        const channelId = render(config.channelId);
        const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;
        const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: { part: 'snippet', channelId, maxResults, order: 'date', type: 'video' },
          headers,
        });
        result = res.data;
        break;
      }

      case 'getChannelStats': {
        const channelId = render(config.channelId);
        const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
          params: { part: 'statistics,snippet', id: channelId },
          headers,
        });
        result = res.data;
        break;
      }

      case 'getSubscribers': {
        const channelId = render(config.channelId);
        const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
          params: { part: 'statistics', id: channelId },
          headers,
        });
        result = res.data;
        break;
      }

      case 'createComment': {
        const videoId = render(config.videoId);
        const text = render(config.text);
        const res = await axios.post('https://www.googleapis.com/youtube/v3/commentThreads', {
          snippet: { videoId, topLevelComment: { snippet: { textDisplay: text } } },
        }, { params: { part: 'snippet' }, headers });
        result = res.data;
        break;
      }

      case 'updateComment': {
        const commentId = render(config.commentId);
        const text = render(config.text);
        const res = await axios.put('https://www.googleapis.com/youtube/v3/comments', {
          id: commentId,
          snippet: { textDisplay: text },
        }, { params: { part: 'snippet' }, headers });
        result = res.data;
        break;
      }

      case 'deleteComment': {
        const commentId = render(config.commentId);
        await axios.delete('https://www.googleapis.com/youtube/v3/comments', {
          params: { id: commentId },
          headers,
        });
        result = { status: 'deleted' };
        break;
      }

      case 'replyComment': {
        const parentCommentId = render(config.parentCommentId);
        const text = render(config.text);
        const res = await axios.post('https://www.googleapis.com/youtube/v3/comments', {
          snippet: { parentId: parentCommentId, textDisplay: text },
        }, { params: { part: 'snippet' }, headers });
        result = res.data;
        break;
      }

      case 'analytics': {
        const ids = render(config.ids || 'channel==MINE');
        const startDate = render(config.startDate);
        const endDate = render(config.endDate);
        const metrics = render(config.metrics);
        const dimensions = render(config.dimensions || '');
        const filters = render(config.filters || '');
        const params: any = { ids, startDate, endDate, metrics };
        if (dimensions) params.dimensions = dimensions;
        if (filters) params.filters = filters;

        const res = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', {
          params,
          headers,
        });
        result = res.data;
        break;
      }

      case 'channel_stats': {
        const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
          params: { part: 'statistics,snippet,contentDetails', mine: true },
          headers,
        });
        result = res.data;
        break;
      }

      case 'list_my_videos': {
        const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;
        const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: { part: 'snippet', forMine: true, type: 'video', maxResults, order: 'date' },
          headers,
        });
        result = res.data;
        break;
      }

      case 'video_stats': {
        const videoId = render(config.videoId);
        const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: { part: 'statistics,snippet', id: videoId },
          headers,
        });
        result = res.data;
        break;
      }

      default:
        throw new Error(`Unknown YouTube operation: ${operation}`);
    }

    return { status: 'success', data: result };
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message;
    throw new Error(`[YouTube Error] ${msg}`);
  }
};
