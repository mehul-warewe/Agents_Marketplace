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

export const sheetsHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;
  const operation = config.operation;
  const token = credentials?.accessToken;
  if (!token) throw new Error('Google Sheets node requires a valid Google OAuth2 credential.');

  const headers = { Authorization: `Bearer ${token}` };

  switch (operation) {
    case 'append': {
      const spreadsheetId = resolveId(render(config.spreadsheetId));
      const range = render(config.range || 'Sheet1!A1');
      const values = render(config.values);
      let rowValues: any[] = [];
      try {
        rowValues = JSON.parse(values);
        if (!Array.isArray(rowValues)) rowValues = [rowValues];
      } catch {
        rowValues = values.split(',').map((v: string) => v.trim());
      }
      const res = await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
        { values: [rowValues] },
        { headers },
      );
      return { success: true, updatedRange: res.data.updates?.updatedRange };
    }

    case 'read': {
      const spreadsheetId = resolveId(render(config.spreadsheetId));
      const range = render(config.range || 'Sheet1');
      const res = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
        { headers },
      );
      return { success: true, rows: res.data.values || [] };
    }

    case 'update': {
      const spreadsheetId = resolveId(render(config.spreadsheetId));
      const range = render(config.range || 'Sheet1!A1');
      const values = render(config.values);
      let matrix: any[][] = [];
      try { matrix = JSON.parse(values); } catch { matrix = [[values]]; }
      const res = await axios.put(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
        { range, majorDimension: 'ROWS', values: matrix },
        { headers },
      );
      return { success: true, updatedRange: res.data.updatedRange };
    }

    case 'clear': {
      const spreadsheetId = resolveId(render(config.spreadsheetId));
      const range = render(config.range || 'Sheet1');
      await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
        {},
        { headers },
      );
      return { success: true };
    }

    case 'create': {
      const title = render(config.title || 'New Spreadsheet');
      const res = await axios.post(
        'https://sheets.googleapis.com/v4/spreadsheets',
        { properties: { title } },
        { headers },
      );
      return { success: true, spreadsheetId: res.data.spreadsheetId, url: res.data.spreadsheetUrl };
    }

    default:
      throw new Error(`Unknown Google Sheets operation: ${operation}`);
  }
};
