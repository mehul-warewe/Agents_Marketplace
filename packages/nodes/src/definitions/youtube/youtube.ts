import type { NodeDefinition } from '../../types.js';

export const youtubeNode: NodeDefinition = {
  id: 'google.youtube',
  label: 'YouTube',
  name: 'YouTube',
  category: 'Tools',
  variant: 'connector',
  description: 'Complete YouTube integration - manage videos, playlists, channels, comments, and analytics.',
  icon: '/iconSvg/youtube-icon.svg',
  color: '#ff0000',
  bg: 'bg-[#ff0000]/10',
  border: 'border-[#ff0000]/20',
  isTrigger: false,
  executionKey: 'google_youtube',
  usableAsTool: true,
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'any', position: 'right' }],
  credentialTypes: ['google_youtube_oauth'],
  configFields: [
    {
      key: 'auth_notice',
      label: 'Note: Ensure your Google account has YouTube channel access.',
      type: 'notice',
    },
    { key: 'resource', label: 'Resource Type', type: 'select', options: ['video', 'playlist', 'channel', 'comment', 'analytics'] },
    {
      key: 'operation',
      label: 'Operation',
      type: 'select',
      options: ['searchVideos', 'getVideo', 'listVideos', 'getVideoStats', 'getComments', 'listPlaylists', 'getPlaylist', 'createPlaylist', 'updatePlaylist', 'deletePlaylist', 'addToPlaylist', 'removeFromPlaylist', 'getChannel', 'listChannelVideos', 'getChannelStats', 'getSubscribers', 'createComment', 'updateComment', 'deleteComment', 'replyComment', 'analytics', 'channel_stats', 'list_my_videos', 'video_stats'],
    },
  ],
  operationInputs: {
    searchVideos: [
      { key: 'query', label: 'Search Query', type: 'string', required: true, description: 'Search term', example: 'javascript tutorial' },
      { key: 'maxResults', label: 'Max Results', type: 'string', required: false, description: 'Number of results', example: '10' },
      { key: 'order', label: 'Order', type: 'string', required: false, description: 'relevance, date, viewCount, etc.', example: 'relevance' },
    ],
    getVideo: [
      { key: 'videoId', label: 'Video ID', type: 'string', required: true, description: 'Video ID', example: 'dQw4w9WgXcQ' },
    ],
    listVideos: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: false, description: 'Filter by channel', example: 'UCxxxxxx' },
      { key: 'maxResults', label: 'Max Results', type: 'string', required: false, description: 'Number of results', example: '10' },
    ],
    getVideoStats: [
      { key: 'videoId', label: 'Video ID', type: 'string', required: true, description: 'Video to get stats for', example: 'dQw4w9WgXcQ' },
    ],
    getComments: [
      { key: 'videoId', label: 'Video ID', type: 'string', required: true, description: 'Video to get comments from', example: 'dQw4w9WgXcQ' },
      { key: 'maxResults', label: 'Max Results', type: 'string', required: false, description: 'Number of comments', example: '20' },
    ],
    listPlaylists: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: false, description: 'Filter by channel', example: 'UCxxxxxx' },
      { key: 'maxResults', label: 'Max Results', type: 'string', required: false, description: 'Number of playlists', example: '10' },
    ],
    getPlaylist: [
      { key: 'playlistId', label: 'Playlist ID', type: 'string', required: true, description: 'Playlist to fetch', example: 'PLxxxxxx' },
    ],
    createPlaylist: [
      { key: 'title', label: 'Title', type: 'string', required: true, description: 'Playlist name', example: 'My Favorites' },
      { key: 'description', label: 'Description', type: 'string', required: false, description: 'Playlist description', example: 'My favorite videos' },
      { key: 'privacyStatus', label: 'Privacy Status', type: 'string', required: false, description: 'public, private, or unlisted', example: 'private' },
    ],
    updatePlaylist: [
      { key: 'playlistId', label: 'Playlist ID', type: 'string', required: true, description: 'Playlist to update', example: 'PLxxxxxx' },
      { key: 'title', label: 'Title', type: 'string', required: false, description: 'New name', example: 'Updated name' },
      { key: 'description', label: 'Description', type: 'string', required: false, description: 'New description', example: 'Updated description' },
    ],
    deletePlaylist: [
      { key: 'playlistId', label: 'Playlist ID', type: 'string', required: true, description: 'Playlist to delete', example: 'PLxxxxxx' },
    ],
    addToPlaylist: [
      { key: 'playlistId', label: 'Playlist ID', type: 'string', required: true, description: 'Target playlist', example: 'PLxxxxxx' },
      { key: 'videoId', label: 'Video ID', type: 'string', required: true, description: 'Video to add', example: 'dQw4w9WgXcQ' },
    ],
    removeFromPlaylist: [
      { key: 'playlistId', label: 'Playlist ID', type: 'string', required: true, description: 'Playlist', example: 'PLxxxxxx' },
      { key: 'playlistItemId', label: 'Playlist Item ID', type: 'string', required: true, description: 'Item to remove', example: 'item123' },
    ],
    getChannel: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: false, description: 'Channel to fetch', example: 'UCxxxxxx' },
      { key: 'forUsername', label: 'Username', type: 'string', required: false, description: 'Or use username', example: 'username' },
    ],
    listChannelVideos: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel', example: 'UCxxxxxx' },
      { key: 'maxResults', label: 'Max Results', type: 'string', required: false, description: 'Number of videos', example: '10' },
    ],
    getChannelStats: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel', example: 'UCxxxxxx' },
    ],
    getSubscribers: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel', example: 'UCxxxxxx' },
    ],
    createComment: [
      { key: 'videoId', label: 'Video ID', type: 'string', required: true, description: 'Video to comment on', example: 'dQw4w9WgXcQ' },
      { key: 'text', label: 'Comment Text', type: 'string', required: true, description: 'Comment', example: 'Great video!' },
    ],
    updateComment: [
      { key: 'commentId', label: 'Comment ID', type: 'string', required: true, description: 'Comment to update', example: 'comment123' },
      { key: 'text', label: 'New Text', type: 'string', required: true, description: 'Updated comment', example: 'Updated comment' },
    ],
    deleteComment: [
      { key: 'commentId', label: 'Comment ID', type: 'string', required: true, description: 'Comment to delete', example: 'comment123' },
    ],
    replyComment: [
      { key: 'parentCommentId', label: 'Parent Comment ID', type: 'string', required: true, description: 'Comment to reply to', example: 'comment123' },
      { key: 'text', label: 'Reply Text', type: 'string', required: true, description: 'Reply', example: 'Thanks for the comment!' },
    ],
    analytics: [
      { key: 'startDate', label: 'Start Date', type: 'string', required: true, description: 'YYYY-MM-DD format', example: '2024-01-01' },
      { key: 'endDate', label: 'End Date', type: 'string', required: true, description: 'YYYY-MM-DD format', example: '2024-01-31' },
      { key: 'metrics', label: 'Metrics', type: 'string', required: true, description: 'Comma-separated', example: 'views,likes,comments' },
      { key: 'dimensions', label: 'Dimensions', type: 'string', required: false, description: 'Group by', example: 'day' },
    ],
    channel_stats: [
    ],
    list_my_videos: [
      { key: 'maxResults', label: 'Max Results', type: 'string', required: false, description: 'Limit results', example: '10' },
    ],
    video_stats: [
      { key: 'videoId', label: 'Video ID', type: 'string', required: true, description: 'Video ID', example: 'dQw4w9WgXcQ' },
    ],
  },
  operationOutputs: {
    searchVideos: [
      { key: 'results', type: 'array', description: 'Array of video search results' },
      { key: 'videos', type: 'array', description: 'List of videos with details' },
      { key: 'count', type: 'number', description: 'Total number of results' },
      { key: 'nextPageToken', type: 'string', description: 'Token for pagination' },
    ],
    getVideo: [
      { key: 'videoId', type: 'string', description: 'Video ID' },
      { key: 'title', type: 'string', description: 'Video title' },
      { key: 'description', type: 'string', description: 'Video description' },
      { key: 'views', type: 'number', description: 'View count' },
      { key: 'likes', type: 'number', description: 'Like count' },
      { key: 'duration', type: 'string', description: 'Video duration' },
      { key: 'url', type: 'string', description: 'Video URL' },
    ],
    listVideos: [
      { key: 'videos', type: 'array', description: 'Array of videos' },
      { key: 'count', type: 'number', description: 'Number of videos returned' },
      { key: 'nextPageToken', type: 'string', description: 'Pagination token' },
    ],
    getVideoStats: [
      { key: 'videoId', type: 'string', description: 'Video ID' },
      { key: 'views', type: 'number', description: 'View count' },
      { key: 'likes', type: 'number', description: 'Like count' },
      { key: 'comments', type: 'number', description: 'Comment count' },
      { key: 'shares', type: 'number', description: 'Share count' },
    ],
    getComments: [
      { key: 'comments', type: 'array', description: 'Array of comments' },
      { key: 'count', type: 'number', description: 'Total comment count' },
    ],
    listPlaylists: [
      { key: 'playlists', type: 'array', description: 'Array of playlists' },
      { key: 'count', type: 'number', description: 'Number of playlists' },
    ],
    getPlaylist: [
      { key: 'playlistId', type: 'string', description: 'Playlist ID' },
      { key: 'title', type: 'string', description: 'Playlist title' },
      { key: 'description', type: 'string', description: 'Playlist description' },
      { key: 'itemCount', type: 'number', description: 'Number of items' },
      { key: 'items', type: 'array', description: 'Videos in playlist' },
    ],
    createPlaylist: [
      { key: 'playlistId', type: 'string', description: 'ID of created playlist' },
      { key: 'title', type: 'string', description: 'Playlist title' },
      { key: 'status', type: 'string', description: 'Creation status' },
    ],
    updatePlaylist: [
      { key: 'playlistId', type: 'string', description: 'Updated playlist ID' },
      { key: 'status', type: 'string', description: 'Update status' },
    ],
    deletePlaylist: [
      { key: 'status', type: 'string', description: 'Deletion status' },
      { key: 'success', type: 'boolean', description: 'Whether deletion succeeded' },
    ],
    addToPlaylist: [
      { key: 'itemId', type: 'string', description: 'ID of added item' },
      { key: 'status', type: 'string', description: 'Addition status' },
    ],
    removeFromPlaylist: [
      { key: 'status', type: 'string', description: 'Removal status' },
      { key: 'success', type: 'boolean', description: 'Whether removal succeeded' },
    ],
    getChannel: [
      { key: 'channelId', type: 'string', description: 'Channel ID' },
      { key: 'title', type: 'string', description: 'Channel title' },
      { key: 'description', type: 'string', description: 'Channel description' },
      { key: 'subscribers', type: 'number', description: 'Subscriber count' },
      { key: 'views', type: 'number', description: 'Total channel views' },
      { key: 'videoCount', type: 'number', description: 'Number of videos' },
      { key: 'url', type: 'string', description: 'Channel URL' },
    ],
    listChannelVideos: [
      { key: 'videos', type: 'array', description: 'Array of channel videos' },
      { key: 'count', type: 'number', description: 'Number of videos' },
      { key: 'nextPageToken', type: 'string', description: 'Pagination token' },
    ],
    getChannelStats: [
      { key: 'channelId', type: 'string', description: 'Channel ID' },
      { key: 'title', type: 'string', description: 'Channel title' },
      { key: 'views', type: 'number', description: 'Total channel views' },
      { key: 'subscribers', type: 'number', description: 'Subscriber count' },
      { key: 'videoCount', type: 'number', description: 'Number of videos' },
      { key: 'description', type: 'string', description: 'Channel description' },
      { key: 'url', type: 'string', description: 'Channel URL' },
    ],
    getSubscribers: [
      { key: 'subscribers', type: 'array', description: 'Array of subscriber objects' },
      { key: 'count', type: 'number', description: 'Number of subscribers' },
    ],
    createComment: [
      { key: 'commentId', type: 'string', description: 'ID of created comment' },
      { key: 'text', type: 'string', description: 'Comment text' },
      { key: 'status', type: 'string', description: 'Creation status' },
    ],
    updateComment: [
      { key: 'commentId', type: 'string', description: 'Updated comment ID' },
      { key: 'status', type: 'string', description: 'Update status' },
    ],
    deleteComment: [
      { key: 'status', type: 'string', description: 'Deletion status' },
      { key: 'success', type: 'boolean', description: 'Whether deletion succeeded' },
    ],
    replyComment: [
      { key: 'replyId', type: 'string', description: 'ID of created reply' },
      { key: 'text', type: 'string', description: 'Reply text' },
      { key: 'status', type: 'string', description: 'Creation status' },
    ],
    analytics: [
      { key: 'metrics', type: 'object', description: 'Analytics metrics' },
      { key: 'data', type: 'array', description: 'Analytics data points' },
      { key: 'startDate', type: 'string', description: 'Start date' },
      { key: 'endDate', type: 'string', description: 'End date' },
    ],
    channel_stats: [
      { key: 'stats', type: 'object', description: 'Channel statistics' },
      { key: 'subscribers', type: 'number', description: 'Subscriber count' },
      { key: 'views', type: 'number', description: 'Total views' },
      { key: 'videoCount', type: 'number', description: 'Video count' },
    ],
    list_my_videos: [
      { key: 'videos', type: 'array', description: 'Array of user videos' },
      { key: 'count', type: 'number', description: 'Number of videos' },
    ],
    video_stats: [
      { key: 'videoId', type: 'string', description: 'Video ID' },
      { key: 'views', type: 'number', description: 'View count' },
      { key: 'likes', type: 'number', description: 'Like count' },
      { key: 'comments', type: 'number', description: 'Comment count' },
    ],
  },
  requiredInputs: [
    {
      key: 'operation',
      label: 'Operation',
      type: 'string',
      required: true,
      description: 'YouTube operation to perform',
      example: 'searchVideos',
    },
  ],
  outputSchema: [
    { key: 'data', type: 'any', description: 'Query results', example: {} },
    { key: 'stats', type: 'object', description: 'Statistics', example: { viewCount: 0 } },
    { key: 'items', type: 'array', description: 'Items returned', example: [] },
    { key: 'status', type: 'string', description: 'Operation status', example: 'success' },
  ],
};
