import type { NodeDefinition } from '../../types.js';

export const mongodbNode: NodeDefinition = {
  id: 'database.mongodb',
  label: 'MongoDB',
  name: 'MongoDB Atlas',
  description: 'Interact with MongoDB Atlas cluster.',
  category: 'Databases',
  variant: 'connector',
  icon: '/iconSvg/mongodb-icon.svg',
  color: 'text-green-500',
  bg: 'bg-green-500/10',
  border: 'border-green-500/20',
  isTrigger: false,
  executionKey: 'mongodb_atlas',
  credentialTypes: ['mongodb_atlas'],
  inputs: [{ name: 'input', type: 'data' }],
  outputs: [{ name: 'output', type: 'memory', color: '#a855f7' }],
  configFields: [
    { key: 'collection', label: 'Collection', type: 'text', placeholder: 'users', default: 'users' },
    {
      key: 'operation',
      label: 'Operation',
      type: 'select',
      options: [
        { label: 'Insert One', value: 'insertOne' },
        { label: 'Find One', value: 'findOne' },
        { label: 'Find Many', value: 'findMany' },
        { label: 'Update One', value: 'updateOne' },
        { label: 'Delete One', value: 'deleteOne' },
        { label: 'Upsert (Update or Insert)', value: 'upsert' },
        { label: 'Create Collection (Table)', value: 'createCollection' },
        { label: 'List Collections (Tables)', value: 'listCollections' },
        { label: 'Count Documents', value: 'count' },
      ],
      default: 'insertOne',
    },
    {
      key: 'document',
      label: 'Document / Filter',
      type: 'textarea',
      placeholder: '{"email": "{input.email}"}',
      displayOptions: { showFor: { operation: ['insertOne', 'findOne', 'updateOne', 'deleteOne', 'upsert'] } },
    },
    {
      key: 'query',
      label: 'Query Filter',
      type: 'textarea',
      placeholder: '{"status": "active"}',
      displayOptions: { showFor: { operation: ['findMany', 'updateOne', 'upsert', 'count'] } },
    },
  ],
  operationOutputs: {
    insertOne: [
      { key: 'status', type: 'string' },
      { key: 'data.insertedId', type: 'string' },
      { key: 'data.acknowledged', type: 'boolean' },
    ],
    findOne: [
      { key: 'status', type: 'string' },
      { key: 'data', type: 'object' },
      { key: 'data._id', type: 'string' },
    ],
    findMany: [
      { key: 'status', type: 'string' },
      { key: 'data', type: 'array' },
      { key: 'data[0]._id', type: 'string' },
    ],
    updateOne: [
      { key: 'status', type: 'string' },
      { key: 'data.matchedCount', type: 'number' },
      { key: 'data.modifiedCount', type: 'number' },
    ],
    deleteOne: [
      { key: 'status', type: 'string' },
      { key: 'data.deletedCount', type: 'number' },
    ],
    count: [
      { key: 'status', type: 'string' },
      { key: 'data.count', type: 'number' },
    ],
  },
};
