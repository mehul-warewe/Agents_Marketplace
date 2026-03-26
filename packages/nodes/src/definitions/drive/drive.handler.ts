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

const driveAPI = {
  listFiles: async (headers: any, query?: string, folderId?: string, maxResults = '20') => {
    let q = query || '';
    if (folderId) q = q ? `${q} and '${folderId}' in parents` : `'${folderId}' in parents`;
    q = q ? `${q} and trashed=false` : 'trashed=false';
    const res = await axios.get('https://www.googleapis.com/drive/v3/files', {
      params: { q, pageSize: maxResults, fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)' },
      headers
    });
    return res.data.files || [];
  },

  getFile: async (headers: any, fileId: string) => {
    const res = await axios.get(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink`, { headers });
    return res.data;
  },

  uploadFile: async (headers: any, fileName: string, content: string, folderId?: string) => {
    const metadata: any = { name: fileName, mimeType: 'text/plain' };
    if (folderId) metadata.parents = [folderId];
    const boundary = 'aether_boundary';
    const multipartBody = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: text/plain\r\n\r\n${content}\r\n--${boundary}--`;
    const res = await axios.post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', multipartBody, {
      headers: { ...headers, 'Content-Type': `multipart/related; boundary=${boundary}` }
    });
    return res.data;
  },

  downloadFile: async (headers: any, fileId: string) => {
    const meta = await axios.get(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType`, { headers });
    const mimeType: string = meta.data.mimeType || '';
    let content = '';
    if (mimeType.startsWith('application/vnd.google-apps.')) {
      const exportMime = mimeType === 'application/vnd.google-apps.spreadsheet' ? 'text/csv' : 'text/plain';
      const exportRes = await axios.get(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${exportMime}`, {
        headers, responseType: 'text'
      });
      content = exportRes.data;
    } else {
      const dlRes = await axios.get(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers, responseType: 'text' });
      content = typeof dlRes.data === 'string' ? dlRes.data : JSON.stringify(dlRes.data);
    }
    return { fileId, name: meta.data.name, mimeType, content };
  },

  updateFile: async (headers: any, fileId: string, content?: string, name?: string) => {
    const metadata: any = {};
    if (name) metadata.name = name;
    if (content) {
      const boundary = 'aether_boundary';
      const multipartBody = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: text/plain\r\n\r\n${content}\r\n--${boundary}--`;
      const res = await axios.patch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, multipartBody, {
        headers: { ...headers, 'Content-Type': `multipart/related; boundary=${boundary}` }
      });
      return res.data;
    } else {
      const res = await axios.patch(`https://www.googleapis.com/drive/v3/files/${fileId}`, metadata, { headers });
      return res.data;
    }
  },

  deleteFile: async (headers: any, fileId: string) => {
    await axios.delete(`https://www.googleapis.com/drive/v3/files/${fileId}`, { headers });
    return { fileId, deleted: true };
  },

  trashFile: async (headers: any, fileId: string) => {
    const res = await axios.patch(`https://www.googleapis.com/drive/v3/files/${fileId}`, { trashed: true }, { headers });
    return res.data;
  },

  restoreFile: async (headers: any, fileId: string) => {
    const res = await axios.patch(`https://www.googleapis.com/drive/v3/files/${fileId}`, { trashed: false }, { headers });
    return res.data;
  },

  permanentlyDelete: async (headers: any, fileId: string) => {
    await axios.delete(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, { headers });
    return { fileId, permanentlyDeleted: true };
  },

  createFolder: async (headers: any, folderName: string, parentId?: string) => {
    const metadata: any = { name: folderName, mimeType: 'application/vnd.google-apps.folder' };
    if (parentId) metadata.parents = [parentId];
    const res = await axios.post('https://www.googleapis.com/drive/v3/files', metadata, {
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
    return res.data;
  },

  listFolder: async (headers: any, folderId: string, maxResults = '20') => {
    const q = `'${folderId}' in parents and trashed=false`;
    const res = await axios.get('https://www.googleapis.com/drive/v3/files', {
      params: { q, pageSize: maxResults, fields: 'files(id,name,mimeType,size,createdTime,modifiedTime)' },
      headers
    });
    return res.data.files || [];
  },

  deleteFolder: async (headers: any, folderId: string) => {
    await axios.delete(`https://www.googleapis.com/drive/v3/files/${folderId}`, { headers });
    return { folderId, deleted: true };
  },

  shareFile: async (headers: any, fileId: string, emailAddress?: string, role = 'reader', type?: string) => {
    const shareType = type || (emailAddress ? 'user' : 'anyone');
    const permission: any = { role, type: shareType };
    if (emailAddress) permission.emailAddress = emailAddress;
    const res = await axios.post(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, permission, {
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
    return res.data;
  },

  unshareFile: async (headers: any, fileId: string, permissionId: string) => {
    await axios.delete(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions/${permissionId}`, { headers });
    return { fileId, permissionId, unshared: true };
  },

  listSharedWith: async (headers: any, fileId: string) => {
    const res = await axios.get(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      params: { fields: 'permissions(id,emailAddress,role,type)' },
      headers
    });
    return res.data.permissions || [];
  },

  updatePermissions: async (headers: any, fileId: string, permissionId: string, role: string) => {
    const res = await axios.patch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions/${permissionId}`, { role }, { headers });
    return res.data;
  },

  changeOwner: async (headers: any, fileId: string, newOwnerId: string) => {
    const res = await axios.patch(`https://www.googleapis.com/drive/v3/files/${fileId}`, { owners: [{ emailAddress: newOwnerId }] }, { headers });
    return res.data;
  },

  searchFiles: async (headers: any, query: string, maxResults = '10') => {
    const q = `${query} and trashed=false`;
    const res = await axios.get('https://www.googleapis.com/drive/v3/files', {
      params: { q, pageSize: maxResults, fields: 'files(id,name,mimeType,webViewLink)' },
      headers
    });
    return res.data.files || [];
  },

  searchByMimeType: async (headers: any, mimeType: string, maxResults = '10') => {
    const q = `mimeType='${mimeType}' and trashed=false`;
    const res = await axios.get('https://www.googleapis.com/drive/v3/files', {
      params: { q, pageSize: maxResults, fields: 'files(id,name,mimeType,webViewLink)' },
      headers
    });
    return res.data.files || [];
  },

  emptyTrash: async (headers: any) => {
    await axios.delete('https://www.googleapis.com/drive/v3/files/trash', { headers });
    return { trash: 'emptied' };
  },

  addComment: async (headers: any, fileId: string, text: string) => {
    const res = await axios.post(`https://www.googleapis.com/drive/v3/files/${fileId}/comments`, { content: text }, { headers });
    return res.data;
  },

  listComments: async (headers: any, fileId: string) => {
    const res = await axios.get(`https://www.googleapis.com/drive/v3/files/${fileId}/comments`, {
      params: { fields: 'comments(id,author,content,createdTime)' },
      headers
    });
    return res.data.comments || [];
  },

  deleteComment: async (headers: any, fileId: string, commentId: string) => {
    await axios.delete(`https://www.googleapis.com/drive/v3/files/${fileId}/comments/${commentId}`, { headers });
    return { fileId, commentId, deleted: true };
  },

  replyComment: async (headers: any, fileId: string, commentId: string, text: string) => {
    const res = await axios.post(`https://www.googleapis.com/drive/v3/files/${fileId}/comments/${commentId}/replies`, { content: text }, { headers });
    return res.data;
  }
};

export const driveHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;
  const operation = render(config.operation || 'listFiles');
  const token = credentials?.accessToken;

  if (!token) throw new Error('Google Drive node requires valid OAuth2 credential.');

  const headers = { Authorization: `Bearer ${token}` };

  try {
    let result: any;

    switch (operation) {
      case 'listFiles':
        result = await driveAPI.listFiles(headers, render(config.query), resolveId(render(config.folderId)), render(config.maxResults));
        break;
      case 'getFile':
        result = await driveAPI.getFile(headers, resolveId(render(config.fileId)));
        break;
      case 'createFile':
        result = await driveAPI.uploadFile(headers, render(config.fileName), '', resolveId(render(config.folderId)));
        break;
      case 'uploadFile':
        result = await driveAPI.uploadFile(headers, render(config.fileName), render(config.content), resolveId(render(config.folderId)));
        break;
      case 'downloadFile':
        result = await driveAPI.downloadFile(headers, resolveId(render(config.fileId)));
        break;
      case 'updateFile':
        result = await driveAPI.updateFile(headers, resolveId(render(config.fileId)), render(config.content), render(config.name));
        break;
      case 'deleteFile':
        result = await driveAPI.deleteFile(headers, resolveId(render(config.fileId)));
        break;
      case 'trashFile':
        result = await driveAPI.trashFile(headers, resolveId(render(config.fileId)));
        break;
      case 'restoreFile':
        result = await driveAPI.restoreFile(headers, resolveId(render(config.fileId)));
        break;
      case 'permanentlyDelete':
        result = await driveAPI.permanentlyDelete(headers, resolveId(render(config.fileId)));
        break;
      case 'createFolder':
        result = await driveAPI.createFolder(headers, render(config.folderName), resolveId(render(config.parentId)));
        break;
      case 'listFolder':
        result = await driveAPI.listFolder(headers, resolveId(render(config.folderId)), render(config.maxResults));
        break;
      case 'deleteFolder':
        result = await driveAPI.deleteFolder(headers, resolveId(render(config.folderId)));
        break;
      case 'emptyTrash':
        result = await driveAPI.emptyTrash(headers);
        break;
      case 'shareFile':
        result = await driveAPI.shareFile(headers, resolveId(render(config.fileId)), render(config.emailAddress), render(config.role), render(config.type));
        break;
      case 'unshareFile':
        result = await driveAPI.unshareFile(headers, resolveId(render(config.fileId)), render(config.permissionId));
        break;
      case 'listSharedWith':
        result = await driveAPI.listSharedWith(headers, resolveId(render(config.fileId)));
        break;
      case 'updatePermissions':
        result = await driveAPI.updatePermissions(headers, resolveId(render(config.fileId)), render(config.permissionId), render(config.role));
        break;
      case 'changeOwner':
        result = await driveAPI.changeOwner(headers, resolveId(render(config.fileId)), render(config.newOwnerId));
        break;
      case 'searchFiles':
        result = await driveAPI.searchFiles(headers, render(config.query), render(config.maxResults));
        break;
      case 'searchByMimeType':
        result = await driveAPI.searchByMimeType(headers, render(config.mimeType), render(config.maxResults));
        break;
      case 'addComment':
        result = await driveAPI.addComment(headers, resolveId(render(config.fileId)), render(config.text));
        break;
      case 'listComments':
        result = await driveAPI.listComments(headers, resolveId(render(config.fileId)));
        break;
      case 'deleteComment':
        result = await driveAPI.deleteComment(headers, resolveId(render(config.fileId)), render(config.commentId));
        break;
      case 'replyComment':
        result = await driveAPI.replyComment(headers, resolveId(render(config.fileId)), render(config.commentId), render(config.text));
        break;
      default:
        throw new Error(`Unknown Drive operation: ${operation}`);
    }

    return { status: 'success', data: result };
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message;
    throw new Error(`[Drive Error] ${msg}`);
  }
};
