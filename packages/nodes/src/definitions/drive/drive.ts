import type { NodeDefinition } from '../../types.js';

export const driveNode: NodeDefinition = {
  id: 'google.drive',
  label: 'Google Drive',
  name: 'Drive',
  category: 'Tools',
  variant: 'connector',
  description: 'Upload, list, read, delete, create folders, or share files in Google Drive.',
  icon: '/iconSvg/google-drive.svg',
  color: '#fbbc04',
  bg: 'bg-[#fbbc04]/10',
  border: 'border-[#fbbc04]/20',
  isTrigger: false,
  executionKey: 'google_drive',
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'data', position: 'right' }],
  credentialTypes: ['google_drive_oauth'],
  configFields: [
    {
      key: 'auth_notice',
      label: 'Note: Ensure your Google account is connected to allow authentication for this node.',
      type: 'notice',
    },
    { key: 'resource', label: 'Resource', type: 'select', options: ['file', 'folder'] },
    {
      key: 'operation',
      label: 'Operation',
      type: 'select',
      options: ['upload', 'list', 'get_content', 'create_folder', 'share', 'delete'],
    },
  ],
  operationFields: {
    upload: [
      { key: 'fileName', label: 'File Name', type: 'text', placeholder: 'report.txt' },
      { key: 'content', label: 'File Content', type: 'textarea', placeholder: 'Content to upload...' },
      { key: 'folderId', label: 'Folder ID (optional)', type: 'text', placeholder: 'Leave empty for root' },
    ],
    list: [
      { key: 'query', label: 'Filter Query (optional)', type: 'text', placeholder: "name contains 'report'" },
      { key: 'folderId', label: 'Folder ID (optional)', type: 'text', placeholder: 'Leave empty for all files' },
      { key: 'maxResults', label: 'Max Results', type: 'text', placeholder: '20' },
    ],
    get_content: [
      { key: 'fileId', label: 'File ID', type: 'text', placeholder: '1BxiMV...' },
    ],
    delete: [
      { key: 'fileId', label: 'File ID', type: 'text', placeholder: '1BxiMV...' },
    ],
    create_folder: [
      { key: 'folderName', label: 'Folder Name', type: 'text', placeholder: 'My Reports' },
      { key: 'parentId', label: 'Parent Folder ID (optional)', type: 'text', placeholder: 'Leave empty for root' },
    ],
    share: [
      { key: 'fileId', label: 'File or Folder ID', type: 'text', placeholder: '1BxiMV...' },
      { key: 'emailAddress', label: 'Share with Email (optional)', type: 'text', placeholder: 'user@example.com — empty = anyone' },
      { key: 'role', label: 'Permission', type: 'select', options: ['reader', 'writer', 'commenter'] },
    ],
  },
};
