import type { NodeDefinition } from '../../types.js';

export const youtubeNode: NodeDefinition = {
  id: 'google.youtube',
  label: 'YouTube',
  name: 'YouTube',
  category: 'Tools',
  variant: 'connector',
  description: 'Get YouTube channel stats, list videos, and query analytics reports.',
  icon: '/iconSvg/youtube-icon.svg',
  color: '#ff0000',
  bg: 'bg-[#ff0000]/10',
  border: 'border-[#ff0000]/20',
  isTrigger: false,
  executionKey: 'google_youtube',
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'data', position: 'right' }],
  credentialTypes: ['google_youtube_oauth'],
  configFields: [
    {
      key: 'auth_notice',
      label: 'Note: Ensure your Google account has YouTube channel access.',
      type: 'notice',
    },
    { key: 'resource', label: 'Resource', type: 'select', options: ['channel', 'video', 'analytics'] },
    {
      key: 'operation',
      label: 'Operation',
      type: 'select',
      options: ['channel_stats', 'list_my_videos', 'video_stats', 'analytics'],
    },
  ],
  operationFields: {
    channel_stats: [],
    list_my_videos: [
      { key: 'maxResults', label: 'Max Results', type: 'text', placeholder: '10' },
    ],
    video_stats: [
      { key: 'videoId', label: 'Video ID or URL', type: 'text', placeholder: 'dQw4w9WgXcQ' },
    ],
    analytics: [
      { key: 'startDate', label: 'Start Date (YYYY-MM-DD)', type: 'text', placeholder: '2024-01-01' },
      { key: 'endDate', label: 'End Date (YYYY-MM-DD)', type: 'text', placeholder: '2024-01-31' },
      { key: 'metrics', label: 'Metrics', type: 'text', placeholder: 'views,likes,comments' },
      { key: 'dimensions', label: 'Dimensions', type: 'text', placeholder: 'day' },
    ],
  },
};
