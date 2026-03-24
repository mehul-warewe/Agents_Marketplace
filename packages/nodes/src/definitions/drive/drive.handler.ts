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

export const driveHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;
  const operation = config.operation;
  const token = credentials?.accessToken;
  if (!token) throw new Error('Google Drive node requires a valid Google OAuth2 credential.');

  const headers = { Authorization: `Bearer ${token}` };

  switch (operation) {
    case 'upload': {
      const fileName = render(config.fileName || 'Untitled.txt');
      const content = render(config.content || '');
      const folderId = resolveId(render(config.folderId || ''));
      const metadata: any = { name: fileName, mimeType: 'text/plain' };
      if (folderId) metadata.parents = [folderId];
      const boundary = 'aether_boundary';
      const multipartBody =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: text/plain\r\n\r\n` +
        `${content}\r\n` +
        `--${boundary}--`;
      const res = await axios.post(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        multipartBody,
        { headers: { ...headers, 'Content-Type': `multipart/related; boundary=${boundary}` } },
      );
      return { success: true, fileId: res.data.id, name: res.data.name };
    }

    case 'list': {
      const query = render(config.query || '');
      const maxResults = parseInt(render(config.maxResults || '20'), 10) || 20;
      const folderId = resolveId(render(config.folderId || ''));
      let q = query || '';
      if (folderId) q = q ? `${q} and '${folderId}' in parents` : `'${folderId}' in parents`;
      q = q ? `${q} and trashed=false` : 'trashed=false';
      const res = await axios.get(
        'https://www.googleapis.com/drive/v3/files',
        { params: { q, pageSize: maxResults, fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)' }, headers },
      );
      return { success: true, files: res.data.files || [] };
    }

    case 'delete': {
      const fileId = resolveId(render(config.fileId));
      await axios.delete(`https://www.googleapis.com/drive/v3/files/${fileId}`, { headers });
      return { success: true, fileId, deleted: true };
    }

    case 'create_folder': {
      const folderName = render(config.folderName || 'New Folder');
      const parentId = resolveId(render(config.parentId || ''));
      const metadata: any = { name: folderName, mimeType: 'application/vnd.google-apps.folder' };
      if (parentId) metadata.parents = [parentId];
      const res = await axios.post(
        'https://www.googleapis.com/drive/v3/files',
        metadata,
        { headers: { ...headers, 'Content-Type': 'application/json' } },
      );
      return { success: true, folderId: res.data.id, name: res.data.name };
    }

    case 'share': {
      const fileId = resolveId(render(config.fileId));
      const emailAddress = render(config.emailAddress || '');
      const role = render(config.role || 'reader');
      const type = emailAddress ? 'user' : 'anyone';
      const permission: any = { role, type };
      if (emailAddress) permission.emailAddress = emailAddress;
      const res = await axios.post(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
        permission,
        { headers: { ...headers, 'Content-Type': 'application/json' } },
      );
      return { success: true, fileId, permissionId: res.data.id, role, type };
    }

    case 'get_content': {
        const fileId = render(config.fileId);
        const meta = await axios.get(
            `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType`,
            { headers }
          );
          const mimeType: string = meta.data.mimeType || '';
          let content = '';
          if (mimeType.startsWith('application/vnd.google-apps.')) {
            const exportMime = mimeType === 'application/vnd.google-apps.spreadsheet' ? 'text/csv' : 'text/plain';
            const exportRes = await axios.get(
              `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${exportMime}`,
              { headers, responseType: 'text' }
            );
            content = exportRes.data;
          } else {
            const dlRes = await axios.get(
              `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
              { headers, responseType: 'text' }
            );
            content = typeof dlRes.data === 'string' ? dlRes.data : JSON.stringify(dlRes.data);
          }
          return { success: true, fileId, name: meta.data.name, mimeType, content };
    }

    default:
      throw new Error(`Unknown Google Drive operation: ${operation}`);
  }
};
