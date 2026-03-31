import type { NodeDefinition } from '../../types.js';

export const redditNode: NodeDefinition = {
  id: 'reddit.mcp',
  label: 'Reddit',
  name: 'Reddit',
  category: 'Tools',
  variant: 'connector',
  description: 'Add posts, comments, and explore subreddits.',
  icon: '/iconSvg/reddit.svg',
  color: '#FF4500',
  executionKey: 'reddit_mcp',
  usableAsTool: true,
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'any', position: 'right' }],
  isTrigger: false,
  bg: 'bg-[#FF4500]/10',
  border: 'border-[#FF4500]/20',
  credentialTypes: ['reddit_oauth'],
  configFields: [
    {
      key: 'resource',
      label: 'Resource',
      type: 'select',
      options: [
        { label: 'Post', value: 'post' },
        { label: 'Comment', value: 'comment' },
        { label: 'Subreddit', value: 'subreddit' },
      ],
      default: 'post',
    },
    {
      key: 'operation',
      label: 'Operation',
      type: 'select',
      options: [
        { label: 'Submit Post', value: 'submitPost' },
        { label: 'Create Comment / Reply', value: 'createComment' },
        { label: 'List Posts', value: 'listPosts' },
        { label: 'Get My Info', value: 'getMe' },
      ],
      default: 'submitPost',
    },
  ],
  operationInputs: {
    submitPost: [
      { key: 'subreddit', label: 'Subreddit Name', type: 'string', required: true, description: 'Subreddit to post to (without r/)', example: 'test' },
      { key: 'title', label: 'Title', type: 'string', required: true, description: 'Post title', example: 'Hello Reddit!' },
      { key: 'kind', label: 'Kind', type: 'string', default: 'self', required: true, description: 'Type of post (self or link)' },
      { key: 'text', label: 'Text Body', type: 'string', required: false, description: 'Self post text' },
      { key: 'url', label: 'URL', type: 'string', required: false, description: 'Link post URL' },
    ],
    createComment: [
      { key: 'parentId', label: 'Parent ID', type: 'string', required: true, description: 'ID of the post (t3_XXX) or comment (t1_XXX) to reply to', example: 't3_123abc' },
      { key: 'text', label: 'Comment Text', type: 'string', required: true, description: 'Text of the comment' },
    ],
    listPosts: [
      { key: 'subreddit', label: 'Subreddit', type: 'string', required: true, description: 'Subreddit to list from', example: 'technology' },
      { key: 'category', label: 'Category', type: 'string', default: 'hot', required: true, description: 'Ranking category for posts' },
      { key: 'limit', label: 'Limit', type: 'number', required: false, default: 10, description: 'Maximum number of items to return' },
    ],
    getMe: [],
  },
  operationOutputs: {
    submitPost: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.name', type: 'string' },
    ],
    createComment: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.name', type: 'string' },
    ],
    listPosts: [
      { key: 'status', type: 'string' },
      { key: 'data[0].id', type: 'string' },
      { key: 'data[0].title', type: 'string' },
      { key: 'data[0].url', type: 'string' },
    ],
  },
  requiredInputs: [
    { key: 'operation', label: 'Operation', type: 'string', required: true, description: 'The operation to perform' },
  ],
};
