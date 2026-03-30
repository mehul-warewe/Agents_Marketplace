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
      { key: 'ids', label: 'Ids', type: 'string', required: true, description: 'Channel or content owner (e.g., channel==MINE)', example: 'channel==MINE' },
      { key: 'startDate', label: 'Start Date', type: 'string', required: true, description: 'YYYY-MM-DD', example: '2024-01-01' },
      { key: 'endDate', label: 'End Date', type: 'string', required: true, description: 'YYYY-MM-DD', example: '2024-01-31' },
      { key: 'metrics', label: 'Metrics', type: 'string', required: true, description: 'Comma-separated metrics (e.g., views,likes,subscribersGained)', example: 'views,likes,comments' },
      { key: 'dimensions', label: 'Dimensions', type: 'string', required: false, description: 'Comma-separated dimensions (e.g., video,day,country)', example: 'day' },
      { key: 'filters', label: 'Filters', type: 'string', required: false, description: 'Filter parameters', example: 'video==VIDEO_ID' },
    ],
    channel_stats: [],
    list_my_videos: [
      { key: 'maxResults', label: 'Max Results', type: 'string', required: false, description: 'Max items to return', example: '10' },
    ],
    search: [
      { key: 'q', label: 'Search Query', type: 'string', required: true, description: 'Search keywords', example: 'cats and dogs' },
      { key: 'maxResults', label: 'Max Results', type: 'string', required: false, description: 'Max items', example: '10' },
    ],
    video_stats: [
      { key: 'videoId', label: 'Video ID', type: 'string', required: true, description: 'Video ID', example: 'dQw4w9WgXcQ' },
    ],
  },
  operationOutputs: {
    searchVideos: [
      { key: 'status', type: 'string' },
      { key: 'data.items[0].id.videoId', type: 'string' },
      { key: 'data.items[0].snippet.title', type: 'string' },
      { key: 'data.items[0].snippet.description', type: 'string' },
      { key: 'data.items[0].snippet.thumbnails.high.url', type: 'string' },
    ],
    getVideo: [
      { key: 'status', type: 'string' },
      { key: 'data.items[0].id', type: 'string' },
      { key: 'data.items[0].snippet.title', type: 'string' },
      { key: 'data.items[0].snippet.description', type: 'string' },
      { key: 'data.items[0].statistics.viewCount', type: 'string' },
    ],
    listVideos: [
      { key: 'status', type: 'string' },
      { key: 'data.items[0].snippet.title', type: 'string' },
      { key: 'data.items[0].id.videoId', type: 'string' },
    ],
    getVideoStats: [
      { key: 'status', type: 'string' },
      { key: 'data.items[0].id', type: 'string' },
      { key: 'data.items[0].statistics.viewCount', type: 'string' },
      { key: 'data.items[0].statistics.likeCount', type: 'string' },
    ],
    getComments: [
      { key: 'status', type: 'string' },
      { key: 'data.items[0].snippet.topLevelComment.snippet.textDisplay', type: 'string' },
      { key: 'data.items[0].snippet.topLevelComment.snippet.authorDisplayName', type: 'string' },
    ],
    listPlaylists: [
      { key: 'status', type: 'string' },
      { key: 'data.items[0].id', type: 'string' },
      { key: 'data.items[0].snippet.title', type: 'string' },
    ],
    getPlaylist: [
      { key: 'status', type: 'string' },
      { key: 'data.items[0].id', type: 'string' },
      { key: 'data.items[0].snippet.title', type: 'string' },
    ],
    createPlaylist: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.snippet.title', type: 'string' },
    ],
    updatePlaylist: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
    deletePlaylist: [
      { key: 'status', type: 'string' },
    ],
    addToPlaylist: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
    removeFromPlaylist: [
      { key: 'status', type: 'string' },
    ],
    getChannel: [
      { key: 'status', type: 'string' },
      { key: 'data.items[0].id', type: 'string' },
      { key: 'data.items[0].snippet.title', type: 'string' },
      { key: 'data.items[0].statistics.subscriberCount', type: 'string' },
    ],
    listChannelVideos: [
      { key: 'status', type: 'string' },
      { key: 'data.items[0].id.videoId', type: 'string' },
    ],
    getChannelStats: [
      { key: 'status', type: 'string' },
      { key: 'data.items[0].statistics.viewCount', type: 'string' },
      { key: 'data.items[0].statistics.subscriberCount', type: 'string' },
    ],
    getSubscribers: [
      { key: 'status', type: 'string' },
      { key: 'data.items[0].statistics.subscriberCount', type: 'string' },
    ],
    createComment: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
    updateComment: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
    deleteComment: [
      { key: 'status', type: 'string' },
    ],
    replyComment: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
    analytics: [
      { key: 'status', type: 'string' },
      { key: 'data.rows[0]', type: 'array' },
      { key: 'data.columnHeaders[0].name', type: 'string' },
    ],
    channel_stats: [
      { key: 'status', type: 'string' },
      { key: 'data.items[0].statistics.viewCount', type: 'string' },
    ],
    list_my_videos: [
      { key: 'status', type: 'string' },
      { key: 'data.items[0].snippet.title', type: 'string' },
    ],
    video_stats: [
      { key: 'status', type: 'string' },
      { key: 'data.items[0].statistics.viewCount', type: 'string' },
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
    { key: 'status', type: 'string', description: 'Operation status', example: 'success' },
    { key: 'data', type: 'any', description: 'Raw YouTube API response data', example: {} },
  ],
};
