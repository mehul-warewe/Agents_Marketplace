import axios from 'axios';
import type { ToolHandler, ToolContext } from '../../types.js';

export const youtubeHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;
  const operation = config.operation;
  const token = credentials?.accessToken;
  if (!token) throw new Error('YouTube node requires a valid Google OAuth2 credential.');

  const headers = { Authorization: `Bearer ${token}` };

  try {
    switch (operation) {
      case 'searchVideos': {
        const query = render(config.query);
        const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;
        const order = render(config.order || 'relevance');
        const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: { part: 'snippet', q: query, maxResults, order, type: 'video' },
          headers,
        });
        return { success: true, videos: res.data.items || [], totalResults: res.data.pageInfo?.totalResults };
      }

      case 'getVideo': {
        const videoId = render(config.videoId);
        const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: { part: 'snippet,statistics,contentDetails', id: videoId },
          headers,
        });
        return { success: true, video: res.data.items?.[0] };
      }

      case 'listVideos': {
        const channelId = render(config.channelId);
        const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;
        const params: any = { part: 'snippet', maxResults, order: 'date' };
        if (channelId) params.channelId = channelId;
        const res = await axios.get('https://www.googleapis.com/youtube/v3/search', { params, headers });
        return { success: true, videos: res.data.items || [] };
      }

      case 'getVideoStats': {
        const videoId = render(config.videoId);
        const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: { part: 'statistics,snippet', id: videoId },
          headers,
        });
        const video = res.data.items?.[0];
        return { success: true, videoId, stats: video?.statistics || {} };
      }

      case 'getComments': {
        const videoId = render(config.videoId);
        const maxResults = parseInt(render(config.maxResults || '20'), 10) || 20;
        const res = await axios.get('https://www.googleapis.com/youtube/v3/commentThreads', {
          params: { part: 'snippet', videoId, maxResults, textFormat: 'plainText' },
          headers,
        });
        return { success: true, comments: res.data.items || [] };
      }

      case 'listPlaylists': {
        const channelId = render(config.channelId);
        const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;
        const params: any = { part: 'snippet,contentDetails', maxResults };
        if (channelId) params.channelId = channelId;
        else params.mine = true;
        const res = await axios.get('https://www.googleapis.com/youtube/v3/playlists', { params, headers });
        return { success: true, playlists: res.data.items || [] };
      }

      case 'getPlaylist': {
        const playlistId = render(config.playlistId);
        const res = await axios.get('https://www.googleapis.com/youtube/v3/playlists', {
          params: { part: 'snippet,contentDetails', id: playlistId },
          headers,
        });
        return { success: true, playlist: res.data.items?.[0] };
      }

      case 'createPlaylist': {
        const title = render(config.title);
        const description = render(config.description || '');
        const privacyStatus = render(config.privacyStatus || 'private');
        const res = await axios.post('https://www.googleapis.com/youtube/v3/playlists', {
          snippet: { title, description },
          status: { privacyStatus },
        }, { params: { part: 'snippet,status' }, headers });
        return { success: true, playlistId: res.data.id, playlist: res.data };
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
        return { success: true, playlistId, updated: true };
      }

      case 'deletePlaylist': {
        const playlistId = render(config.playlistId);
        await axios.delete('https://www.googleapis.com/youtube/v3/playlists', {
          params: { id: playlistId },
          headers,
        });
        return { success: true, playlistId, deleted: true };
      }

      case 'addToPlaylist': {
        const playlistId = render(config.playlistId);
        const videoId = render(config.videoId);
        const res = await axios.post('https://www.googleapis.com/youtube/v3/playlistItems', {
          snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId } },
        }, { params: { part: 'snippet' }, headers });
        return { success: true, playlistId, videoId, itemId: res.data.id };
      }

      case 'removeFromPlaylist': {
        const playlistItemId = render(config.playlistItemId);
        await axios.delete('https://www.googleapis.com/youtube/v3/playlistItems', {
          params: { id: playlistItemId },
          headers,
        });
        return { success: true, itemId: playlistItemId, removed: true };
      }

      case 'getChannel': {
        const channelId = render(config.channelId || '');
        const forUsername = render(config.forUsername || '');
        const params: any = { part: 'snippet,statistics,contentDetails' };
        if (channelId) params.id = channelId;
        else if (forUsername) params.forUsername = forUsername;
        else params.mine = true;
        const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', { params, headers });
        return { success: true, channel: res.data.items?.[0] };
      }

      case 'listChannelVideos': {
        const channelId = render(config.channelId);
        const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;
        const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: { part: 'snippet', channelId, maxResults, order: 'date', type: 'video' },
          headers,
        });
        return { success: true, videos: res.data.items || [] };
      }

      case 'getChannelStats': {
        const channelId = render(config.channelId);
        const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
          params: { part: 'statistics,snippet', id: channelId },
          headers,
        });
        const channel = res.data.items?.[0];
        return { success: true, channelId, stats: channel?.statistics || {} };
      }

      case 'getSubscribers': {
        const channelId = render(config.channelId);
        const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
          params: { part: 'statistics', id: channelId },
          headers,
        });
        const subscribers = res.data.items?.[0]?.statistics?.subscriberCount;
        return { success: true, channelId, subscriberCount: subscribers };
      }

      case 'createComment': {
        const videoId = render(config.videoId);
        const text = render(config.text);
        const res = await axios.post('https://www.googleapis.com/youtube/v3/commentThreads', {
          snippet: { videoId, topLevelComment: { snippet: { textDisplay: text } } },
        }, { params: { part: 'snippet' }, headers });
        return { success: true, commentId: res.data.id };
      }

      case 'updateComment': {
        const commentId = render(config.commentId);
        const text = render(config.text);
        const res = await axios.put('https://www.googleapis.com/youtube/v3/comments', {
          id: commentId,
          snippet: { textDisplay: text },
        }, { params: { part: 'snippet' }, headers });
        return { success: true, commentId, updated: true };
      }

      case 'deleteComment': {
        const commentId = render(config.commentId);
        await axios.delete('https://www.googleapis.com/youtube/v3/comments', {
          params: { id: commentId },
          headers,
        });
        return { success: true, commentId, deleted: true };
      }

      case 'replyComment': {
        const parentCommentId = render(config.parentCommentId);
        const text = render(config.text);
        const res = await axios.post('https://www.googleapis.com/youtube/v3/comments', {
          snippet: { parentId: parentCommentId, textDisplay: text },
        }, { params: { part: 'snippet' }, headers });
        return { success: true, commentId: res.data.id };
      }

      case 'analytics': {
        const startDate = render(config.startDate);
        const endDate = render(config.endDate);
        const metrics = render(config.metrics || 'views,likes,comments');
        const dimensions = render(config.dimensions || 'day');
        // YouTube Analytics uses separate endpoint - simplified version
        return { success: true, startDate, endDate, metrics, message: 'Analytics requires YouTube Analytics API scope' };
      }

      case 'channel_stats': {
        const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
          params: { part: 'statistics,snippet,contentDetails', mine: true },
          headers,
        });
        return { success: true, stats: res.data.items?.[0]?.statistics || {} };
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
        const videoId = render(config.videoId);
        const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: { part: 'statistics,snippet', id: videoId },
          headers,
        });
        return { success: true, video: res.data.items?.[0] };
      }

      default:
        throw new Error(`Unknown YouTube operation: ${operation}`);
    }
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message;
    throw new Error(`[YouTube Error] ${msg}`);
  }
};
