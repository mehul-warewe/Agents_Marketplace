import type { NodeDefinition } from '../../types.js';

export const driveNode: NodeDefinition = {
  id: 'google.drive',
  label: 'Google Drive',
  name: 'Drive',
  category: 'Tools',
  variant: 'connector',
  description: 'Complete Google Drive integration - manage files, folders, sharing, search, and comments.',
  icon: '/iconSvg/google-drive.svg',
  color: '#fbbc04',
  bg: 'bg-[#fbbc04]/10',
  border: 'border-[#fbbc04]/20',
  isTrigger: false,
  executionKey: 'google_drive',
  usableAsTool: true,
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'any', position: 'right' }],
  credentialTypes: ['google_drive_oauth'],
  configFields: [
    {
      key: 'auth_notice',
      label: 'Note: Ensure your Google account is connected to allow authentication for this node.',
      type: 'notice',
    },
    { key: 'resource', label: 'Resource Type', type: 'select', options: ['file', 'folder', 'sharing', 'search', 'comment'] },
    {
      key: 'operation',
      label: 'Operation',
      type: 'select',
      options: ['listFiles', 'getFile', 'createFile', 'uploadFile', 'downloadFile', 'updateFile', 'deleteFile', 'trashFile', 'restoreFile', 'permanentlyDelete', 'createFolder', 'listFolder', 'deleteFolder', 'emptyTrash', 'shareFile', 'unshareFile', 'listSharedWith', 'updatePermissions', 'changeOwner', 'searchFiles', 'searchByMimeType', 'addComment', 'listComments', 'deleteComment', 'replyComment'],
    },
  ],
  operationInputs: {
    listFiles: [
      { key: 'query', label: 'Search Query', type: 'string', required: false, description: 'Filter query (e.g., name contains)', example: "name contains 'report'" },
      { key: 'folderId', label: 'Folder ID', type: 'string', required: false, description: 'List files in folder', example: '1BxiMV...' },
      { key: 'maxResults', label: 'Max Results', type: 'string', required: false, description: 'Number of results', example: '20' },
      { key: 'pageToken', label: 'Page Token', type: 'string', required: false, description: 'For pagination', example: 'AQAA...' },
    ],
    getFile: [
      { key: 'fileId', label: 'File ID', type: 'string', required: true, description: 'File to get', example: '1BxiMV...' },
    ],
    createFile: [
      { key: 'fileName', label: 'File Name', type: 'string', required: true, description: 'New file name', example: 'document.txt' },
      { key: 'mimeType', label: 'MIME Type', type: 'string', required: true, description: 'File type', example: 'text/plain' },
      { key: 'folderId', label: 'Folder ID', type: 'string', required: false, description: 'Target folder', example: '1BxiMV...' },
    ],
    uploadFile: [
      { key: 'fileName', label: 'File Name', type: 'string', required: true, description: 'Name to save as', example: 'report.txt' },
      { key: 'content', label: 'File Content', type: 'string', required: true, description: 'File data or URL', example: 'File content here' },
      { key: 'mimeType', label: 'MIME Type', type: 'string', required: false, description: 'File type', example: 'text/plain' },
      { key: 'folderId', label: 'Folder ID', type: 'string', required: false, description: 'Target folder', example: '1BxiMV...' },
    ],
    downloadFile: [
      { key: 'fileId', label: 'File ID', type: 'string', required: true, description: 'File to download', example: '1BxiMV...' },
    ],
    updateFile: [
      { key: 'fileId', label: 'File ID', type: 'string', required: true, description: 'File to update', example: '1BxiMV...' },
      { key: 'content', label: 'New Content', type: 'string', required: false, description: 'Updated content', example: 'New content' },
      { key: 'name', label: 'New Name', type: 'string', required: false, description: 'Rename file', example: 'updated.txt' },
    ],
    deleteFile: [
      { key: 'fileId', label: 'File ID', type: 'string', required: true, description: 'File to delete', example: '1BxiMV...' },
    ],
    trashFile: [
      { key: 'fileId', label: 'File ID', type: 'string', required: true, description: 'File to trash', example: '1BxiMV...' },
    ],
    restoreFile: [
      { key: 'fileId', label: 'File ID', type: 'string', required: true, description: 'File to restore', example: '1BxiMV...' },
    ],
    permanentlyDelete: [
      { key: 'fileId', label: 'File ID', type: 'string', required: true, description: 'File to permanently delete', example: '1BxiMV...' },
    ],
    createFolder: [
      { key: 'folderName', label: 'Folder Name', type: 'string', required: true, description: 'New folder name', example: 'My Folder' },
      { key: 'parentId', label: 'Parent ID', type: 'string', required: false, description: 'Parent folder', example: '1BxiMV...' },
    ],
    listFolder: [
      { key: 'folderId', label: 'Folder ID', type: 'string', required: true, description: 'Folder to list', example: '1BxiMV...' },
      { key: 'maxResults', label: 'Max Results', type: 'string', required: false, description: 'Number of items', example: '20' },
    ],
    deleteFolder: [
      { key: 'folderId', label: 'Folder ID', type: 'string', required: true, description: 'Folder to delete', example: '1BxiMV...' },
    ],
    emptyTrash: [
    ],
    shareFile: [
      { key: 'fileId', label: 'File/Folder ID', type: 'string', required: true, description: 'Resource to share', example: '1BxiMV...' },
      { key: 'emailAddress', label: 'Email Address', type: 'string', required: false, description: 'User email', example: 'user@example.com' },
      { key: 'role', label: 'Role', type: 'string', required: true, description: 'reader, writer, or owner', example: 'reader' },
      { key: 'type', label: 'Share Type', type: 'string', required: false, description: 'user, group, domain, or anyone', example: 'user' },
    ],
    unshareFile: [
      { key: 'fileId', label: 'File/Folder ID', type: 'string', required: true, description: 'Resource to unshare', example: '1BxiMV...' },
      { key: 'permissionId', label: 'Permission ID', type: 'string', required: true, description: 'Permission to remove', example: 'anyoneWithLink' },
    ],
    listSharedWith: [
      { key: 'fileId', label: 'File/Folder ID', type: 'string', required: true, description: 'Resource to check', example: '1BxiMV...' },
    ],
    updatePermissions: [
      { key: 'fileId', label: 'File/Folder ID', type: 'string', required: true, description: 'Resource', example: '1BxiMV...' },
      { key: 'permissionId', label: 'Permission ID', type: 'string', required: true, description: 'Permission to update', example: 'anyoneWithLink' },
      { key: 'role', label: 'New Role', type: 'string', required: true, description: 'reader, writer, or owner', example: 'writer' },
    ],
    changeOwner: [
      { key: 'fileId', label: 'File/Folder ID', type: 'string', required: true, description: 'Resource', example: '1BxiMV...' },
      { key: 'newOwnerId', label: 'New Owner Email', type: 'string', required: true, description: 'New owner email', example: 'owner@example.com' },
    ],
    searchFiles: [
      { key: 'query', label: 'Search Query', type: 'string', required: true, description: 'Search term', example: 'budget 2024' },
      { key: 'maxResults', label: 'Max Results', type: 'string', required: false, description: 'Number of results', example: '10' },
    ],
    searchByMimeType: [
      { key: 'mimeType', label: 'MIME Type', type: 'string', required: true, description: 'File type', example: 'application/pdf' },
      { key: 'maxResults', label: 'Max Results', type: 'string', required: false, description: 'Number of results', example: '10' },
    ],
    addComment: [
      { key: 'fileId', label: 'File ID', type: 'string', required: true, description: 'File to comment on', example: '1BxiMV...' },
      { key: 'text', label: 'Comment Text', type: 'string', required: true, description: 'Comment content', example: 'Please review this section' },
    ],
    listComments: [
      { key: 'fileId', label: 'File ID', type: 'string', required: true, description: 'File to list comments for', example: '1BxiMV...' },
    ],
    deleteComment: [
      { key: 'fileId', label: 'File ID', type: 'string', required: true, description: 'File', example: '1BxiMV...' },
      { key: 'commentId', label: 'Comment ID', type: 'string', required: true, description: 'Comment to delete', example: 'comment123' },
    ],
    replyComment: [
      { key: 'fileId', label: 'File ID', type: 'string', required: true, description: 'File', example: '1BxiMV...' },
      { key: 'commentId', label: 'Comment ID', type: 'string', required: true, description: 'Comment to reply to', example: 'comment123' },
      { key: 'text', label: 'Reply Text', type: 'string', required: true, description: 'Reply content', example: 'Good point!' },
    ],
  },
  requiredInputs: [
    {
      key: 'operation',
      label: 'Operation',
      type: 'string',
      required: true,
      description: 'Drive operation to perform',
      example: 'uploadFile',
    },
  ],
  operationOutputs: {
    listFiles: [
      { key: 'status', type: 'string' },
      { key: 'data.files[0].id', type: 'string' },
      { key: 'data.files[0].name', type: 'string' },
      { key: 'data.files[0].mimeType', type: 'string' },
      { key: 'data.files[0].webViewLink', type: 'string' },
    ],
    getFile: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.name', type: 'string' },
      { key: 'data.mimeType', type: 'string' },
      { key: 'data.size', type: 'string' },
      { key: 'data.webViewLink', type: 'string' },
    ],
    createFile: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.name', type: 'string' },
      { key: 'data.mimeType', type: 'string' },
    ],
    uploadFile: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.name', type: 'string' },
      { key: 'data.mimeType', type: 'string' },
    ],
    downloadFile: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.name', type: 'string' },
      { key: 'data.content', type: 'string' },
    ],
    updateFile: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.name', type: 'string' },
    ],
    deleteFile: [
      { key: 'status', type: 'string' },
    ],
    trashFile: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.trashed', type: 'boolean' },
    ],
    restoreFile: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.trashed', type: 'boolean' },
    ],
    permanentlyDelete: [
      { key: 'status', type: 'string' },
    ],
    createFolder: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.name', type: 'string' },
    ],
    listFolder: [
      { key: 'status', type: 'string' },
      { key: 'data.files[0].id', type: 'string' },
      { key: 'data.files[0].name', type: 'string' },
      { key: 'data.files[0].mimeType', type: 'string' },
    ],
    deleteFolder: [
      { key: 'status', type: 'string' },
    ],
    emptyTrash: [
      { key: 'status', type: 'string' },
    ],
    shareFile: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.role', type: 'string' },
      { key: 'data.type', type: 'string' },
    ],
    unshareFile: [
      { key: 'status', type: 'string' },
    ],
    listSharedWith: [
      { key: 'status', type: 'string' },
      { key: 'data.permissions[0].id', type: 'string' },
      { key: 'data.permissions[0].emailAddress', type: 'string' },
      { key: 'data.permissions[0].role', type: 'string' },
    ],
    updatePermissions: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.role', type: 'string' },
    ],
    changeOwner: [
      { key: 'status', type: 'string' },
    ],
    searchFiles: [
      { key: 'status', type: 'string' },
      { key: 'data.files[0].id', type: 'string' },
      { key: 'data.files[0].name', type: 'string' },
      { key: 'data.files[0].webViewLink', type: 'string' },
    ],
    searchByMimeType: [
      { key: 'status', type: 'string' },
      { key: 'data.files[0].id', type: 'string' },
      { key: 'data.files[0].name', type: 'string' },
    ],
    addComment: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.content', type: 'string' },
    ],
    listComments: [
      { key: 'status', type: 'string' },
      { key: 'data.comments[0].id', type: 'string' },
      { key: 'data.comments[0].content', type: 'string' },
    ],
    deleteComment: [
      { key: 'status', type: 'string' },
    ],
    replyComment: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
  },
  outputSchema: [
    { key: 'status', type: 'string', description: 'Operation status', example: 'success' },
    { key: 'data', type: 'any', description: 'Raw API result from Drive', example: {} },
  ],
};
