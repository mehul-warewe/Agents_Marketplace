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

const sheetsAPI = {
  parseValues: (input: string): any[][] => {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed : [[parsed]];
    } catch {
      return [[input]];
    }
  },

  listSheets: async (headers: any, spreadsheetId: string) => {
    const res = await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, { headers });
    return res.data.sheets || [];
  },

  createSheet: async (headers: any, spreadsheetId: string, title: string) => {
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests: [{ addSheet: { properties: { title } } }] },
      { headers }
    );
    return res.data.replies?.[0]?.addSheet || {};
  },

  deleteSheet: async (headers: any, spreadsheetId: string, sheetId: string) => {
    await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests: [{ deleteSheet: { sheetId: parseInt(sheetId) } }] },
      { headers }
    );
    return { deleted: true };
  },

  renameSheet: async (headers: any, spreadsheetId: string, sheetId: string, newName: string) => {
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests: [{ updateSheetProperties: { properties: { sheetId: parseInt(sheetId), title: newName }, fields: 'title' } }] },
      { headers }
    );
    return res.data;
  },

  readCell: async (headers: any, spreadsheetId: string, range: string) => {
    const res = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      { headers }
    );
    return res.data.values?.[0]?.[0] || null;
  },

  readRange: async (headers: any, spreadsheetId: string, range: string) => {
    const res = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      { headers }
    );
    return res.data.values || [];
  },

  readSheet: async (headers: any, spreadsheetId: string, sheetName: string) => {
    const res = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}`,
      { headers }
    );
    return res.data.values || [];
  },

  writeCell: async (headers: any, spreadsheetId: string, range: string, value: string) => {
    const res = await axios.put(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      { values: [[value]] },
      { headers }
    );
    return res.data;
  },

  writeRange: async (headers: any, spreadsheetId: string, range: string, values: any) => {
    const matrix = typeof values === 'string' ? sheetsAPI.parseValues(values) : values;
    const res = await axios.put(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      { values: matrix },
      { headers }
    );
    return res.data;
  },

  appendRow: async (headers: any, spreadsheetId: string, range: string, values: any) => {
    const rowValues = typeof values === 'string' ? sheetsAPI.parseValues(values)[0] : (Array.isArray(values) ? values : [values]);
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
      { values: [rowValues] },
      { headers }
    );
    return res.data;
  },

  appendRows: async (headers: any, spreadsheetId: string, range: string, rows: any) => {
    const matrix = typeof rows === 'string' ? sheetsAPI.parseValues(rows) : rows;
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
      { values: matrix },
      { headers }
    );
    return res.data;
  },

  insertRow: async (headers: any, spreadsheetId: string, sheetId: string, index: string, values?: any) => {
    const requests: any[] = [{ insertDimension: { range: { sheetId: parseInt(sheetId), dimension: 'ROWS', startIndex: parseInt(index), endIndex: parseInt(index) + 1 } } }];
    if (values) {
      const parsed = typeof values === 'string' ? sheetsAPI.parseValues(values) : [values];
      const rowVals = Array.isArray(parsed) && parsed.length > 0 ? (Array.isArray(parsed[0]) ? parsed[0] : parsed) : [values];
      requests.push({
        updateCells: {
          range: { sheetId: parseInt(sheetId), startRowIndex: parseInt(index), endRowIndex: parseInt(index) + 1 },
          rows: [{ values: rowVals.map((v: any) => ({ userEnteredValue: { stringValue: String(v) } })) }]
        }
      });
    }
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests },
      { headers }
    );
    return res.data;
  },

  deleteRow: async (headers: any, spreadsheetId: string, sheetId: string, index: string) => {
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests: [{ deleteDimension: { range: { sheetId: parseInt(sheetId), dimension: 'ROWS', startIndex: parseInt(index), endIndex: parseInt(index) + 1 } } }] },
      { headers }
    );
    return res.data;
  },

  insertColumn: async (headers: any, spreadsheetId: string, sheetId: string, index: string) => {
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests: [{ insertDimension: { range: { sheetId: parseInt(sheetId), dimension: 'COLUMNS', startIndex: parseInt(index), endIndex: parseInt(index) + 1 } } }] },
      { headers }
    );
    return res.data;
  },

  deleteColumn: async (headers: any, spreadsheetId: string, sheetId: string, index: string) => {
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests: [{ deleteDimension: { range: { sheetId: parseInt(sheetId), dimension: 'COLUMNS', startIndex: parseInt(index), endIndex: parseInt(index) + 1 } } }] },
      { headers }
    );
    return res.data;
  },

  clearRange: async (headers: any, spreadsheetId: string, range: string) => {
    await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
      {},
      { headers }
    );
    return { cleared: true };
  },

  formatCell: async (headers: any, spreadsheetId: string, range: string, format: any) => {
    const formatSpec = typeof format === 'string' ? JSON.parse(format) : format;
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests: [{ updateCells: { range: { a1Notation: range }, userEnteredFormat: formatSpec } }] },
      { headers }
    );
    return res.data;
  },

  setColumnWidth: async (headers: any, spreadsheetId: string, sheetId: string, columnIndex: string, width: string) => {
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests: [{ updateDimensionProperties: { range: { sheetId: parseInt(sheetId), dimension: 'COLUMNS', startIndex: parseInt(columnIndex), endIndex: parseInt(columnIndex) + 1 }, properties: { pixelSize: parseInt(width) }, fields: 'pixelSize' } }] },
      { headers }
    );
    return res.data;
  },

  setRowHeight: async (headers: any, spreadsheetId: string, sheetId: string, rowIndex: string, height: string) => {
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests: [{ updateDimensionProperties: { range: { sheetId: parseInt(sheetId), dimension: 'ROWS', startIndex: parseInt(rowIndex), endIndex: parseInt(rowIndex) + 1 }, properties: { pixelSize: parseInt(height) }, fields: 'pixelSize' } }] },
      { headers }
    );
    return res.data;
  },

  freezeRows: async (headers: any, spreadsheetId: string, sheetId: string, rowCount: string) => {
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests: [{ updateSheetProperties: { properties: { sheetId: parseInt(sheetId), gridProperties: { frozenRowCount: parseInt(rowCount) } }, fields: 'gridProperties.frozenRowCount' } }] },
      { headers }
    );
    return res.data;
  },

  mergeCell: async (headers: any, spreadsheetId: string, range: string) => {
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests: [{ mergeCells: { range: { a1Notation: range } } }] },
      { headers }
    );
    return res.data;
  },

  addFormula: async (headers: any, spreadsheetId: string, range: string, formula: string) => {
    const res = await axios.put(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      { values: [[formula]] },
      { headers }
    );
    return res.data;
  },

  sortRange: async (headers: any, spreadsheetId: string, range: string, column: string, ascending = true) => {
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests: [{ sortRange: { range: { a1Notation: range }, sortSpecs: [{ dimensionIndex: parseInt(column), sortOrder: ascending ? 'ASCENDING' : 'DESCENDING' }] } }] },
      { headers }
    );
    return res.data;
  },

  filterRange: async (headers: any, spreadsheetId: string, range: string, criteria: any) => {
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests: [{ setBasicFilter: { filter: { range: { a1Notation: range } } } }] },
      { headers }
    );
    return res.data;
  },
  duplicateSheet: async (headers: any, spreadsheetId: string, sheetId: string, newTitle?: string) => {
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests: [{ duplicateSheet: { sourceSheetId: parseInt(sheetId), newSheetName: newTitle || undefined } }] },
      { headers }
    );
    return res.data.replies?.[0]?.duplicateSheet || {};
  },

  updateFormula: async (headers: any, spreadsheetId: string, range: string, formula: string) => {
    const res = await axios.put(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      { values: [[formula]] },
      { headers }
    );
    return res.data;
  },

  copyFormula: async (headers: any, spreadsheetId: string, source: string, destination: string) => {
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests: [{ copyPaste: { source: { a1Notation: source }, destination: { a1Notation: destination }, pasteType: 'PASTE_FORMULA' } }] },
      { headers }
    );
    return res.data;
  },

  createChart: async (headers: any, spreadsheetId: string, sheetId: string, dataRange: string, chartType: string) => {
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        requests: [
          {
            addChart: {
              chart: {
                spec: {
                  title: 'New Chart',
                  basicChart: {
                    chartType: chartType as any,
                    legendPosition: 'BOTTOM_LEGEND',
                    axis: [{ position: 'BOTTOM_AXIS', title: 'X-Axis' }, { position: 'LEFT_AXIS', title: 'Y-Axis' }],
                    domains: [{ domain: { sourceRange: { sources: [{ a1Notation: dataRange }] } } }],
                    series: [{ series: { sourceRange: { sources: [{ a1Notation: dataRange }] } }, targetAxis: 'LEFT_AXIS' }]
                  }
                },
                position: { overlayPosition: { anchorCell: { sheetId: parseInt(sheetId), rowIndex: 0, columnIndex: 0 } } }
              }
            }
          }
        ]
      },
      { headers }
    );
    return res.data;
  },

  createPivotTable: async (headers: any, spreadsheetId: string, sourceRange: string, destinationSheetId: string) => {
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        requests: [
          {
            updateCells: {
              rows: [
                {
                  values: [
                    {
                      pivotTable: {
                        source: { a1Notation: sourceRange },
                        rows: [],
                        columns: [],
                        values: [],
                        valueLayout: 'HORIZONTAL'
                      }
                    }
                  ]
                }
              ],
              range: { sheetId: parseInt(destinationSheetId), startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 1 },
              fields: 'pivotTable'
            }
          }
        ]
      },
      { headers }
    );
    return res.data;
  }
};

export const sheetsHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;
  const operation = render(config.operation || 'read');
  const token = credentials?.accessToken;

  if (!token) throw new Error('Google Sheets requires valid OAuth2 credential.');

  const headers = { Authorization: `Bearer ${token}` };

  try {
    let result: any;

    switch (operation) {
      case 'listSheets':
        result = await sheetsAPI.listSheets(headers, resolveId(render(config.spreadsheetId)));
        break;
      case 'createSheet':
        result = await sheetsAPI.createSheet(headers, resolveId(render(config.spreadsheetId)), render(config.title));
        break;
      case 'deleteSheet':
        result = await sheetsAPI.deleteSheet(headers, resolveId(render(config.spreadsheetId)), render(config.sheetId));
        break;
      case 'renameSheet':
        result = await sheetsAPI.renameSheet(headers, resolveId(render(config.spreadsheetId)), render(config.sheetId), render(config.newName));
        break;
      case 'readCell':
        result = await sheetsAPI.readCell(headers, resolveId(render(config.spreadsheetId)), render(config.range));
        break;
      case 'readRange':
        result = await sheetsAPI.readRange(headers, resolveId(render(config.spreadsheetId)), render(config.range));
        break;
      case 'readSheet':
        result = await sheetsAPI.readSheet(headers, resolveId(render(config.spreadsheetId)), render(config.sheetName));
        break;
      case 'writeCell':
        result = await sheetsAPI.writeCell(headers, resolveId(render(config.spreadsheetId)), render(config.range), render(config.value));
        break;
      case 'writeRange':
        result = await sheetsAPI.writeRange(headers, resolveId(render(config.spreadsheetId)), render(config.range), render(config.values));
        break;
      case 'appendRow':
        result = await sheetsAPI.appendRow(headers, resolveId(render(config.spreadsheetId)), render(config.range), render(config.values));
        break;
      case 'appendRows':
        result = await sheetsAPI.appendRows(headers, resolveId(render(config.spreadsheetId)), render(config.range), render(config.values));
        break;
      case 'insertRow':
        result = await sheetsAPI.insertRow(headers, resolveId(render(config.spreadsheetId)), render(config.sheetId), render(config.index), render(config.values));
        break;
      case 'deleteRow':
        result = await sheetsAPI.deleteRow(headers, resolveId(render(config.spreadsheetId)), render(config.sheetId), render(config.index));
        break;
      case 'insertColumn':
        result = await sheetsAPI.insertColumn(headers, resolveId(render(config.spreadsheetId)), render(config.sheetId), render(config.index));
        break;
      case 'deleteColumn':
        result = await sheetsAPI.deleteColumn(headers, resolveId(render(config.spreadsheetId)), render(config.sheetId), render(config.index));
        break;
      case 'clearRange':
        result = await sheetsAPI.clearRange(headers, resolveId(render(config.spreadsheetId)), render(config.range));
        break;
      case 'formatCell':
        result = await sheetsAPI.formatCell(headers, resolveId(render(config.spreadsheetId)), render(config.range), render(config.format));
        break;
      case 'setColumnWidth':
        result = await sheetsAPI.setColumnWidth(headers, resolveId(render(config.spreadsheetId)), render(config.sheetId), render(config.columnIndex), render(config.width));
        break;
      case 'setRowHeight':
        result = await sheetsAPI.setRowHeight(headers, resolveId(render(config.spreadsheetId)), render(config.sheetId), render(config.rowIndex), render(config.height));
        break;
      case 'freezeRows':
        result = await sheetsAPI.freezeRows(headers, resolveId(render(config.spreadsheetId)), render(config.sheetId), render(config.rowCount));
        break;
      case 'mergeCell':
        result = await sheetsAPI.mergeCell(headers, resolveId(render(config.spreadsheetId)), render(config.range));
        break;
      case 'addFormula':
        result = await sheetsAPI.addFormula(headers, resolveId(render(config.spreadsheetId)), render(config.range), render(config.formula));
        break;
      case 'sortRange':
        result = await sheetsAPI.sortRange(headers, resolveId(render(config.spreadsheetId)), render(config.range), render(config.column), render(config.ascending) !== 'false');
        break;
      case 'filterRange':
        result = await sheetsAPI.filterRange(headers, resolveId(render(config.spreadsheetId)), render(config.range), render(config.criteria));
        break;
      case 'duplicateSheet':
        result = await sheetsAPI.duplicateSheet(headers, resolveId(render(config.spreadsheetId)), render(config.sheetId), render(config.newName));
        break;
      case 'updateFormula':
        result = await sheetsAPI.updateFormula(headers, resolveId(render(config.spreadsheetId)), render(config.range), render(config.formula));
        break;
      case 'copyFormula':
        result = await sheetsAPI.copyFormula(headers, resolveId(render(config.spreadsheetId)), render(config.source), render(config.destination));
        break;
      case 'createChart':
        result = await sheetsAPI.createChart(headers, resolveId(render(config.spreadsheetId)), render(config.sheetId), render(config.dataRange), render(config.chartType));
        break;
      case 'createPivotTable':
        result = await sheetsAPI.createPivotTable(headers, resolveId(render(config.spreadsheetId)), render(config.sourceRange), render(config.destinationSheetId));
        break;
      // Legacy operations
      case 'append':
        result = await sheetsAPI.appendRow(headers, resolveId(render(config.spreadsheetId)), render(config.range), render(config.values));
        break;
      case 'read':
        result = await sheetsAPI.readRange(headers, resolveId(render(config.spreadsheetId)), render(config.range));
        break;
      case 'update':
        result = await sheetsAPI.writeRange(headers, resolveId(render(config.spreadsheetId)), render(config.range), render(config.values));
        break;
      case 'clear':
        result = await sheetsAPI.clearRange(headers, resolveId(render(config.spreadsheetId)), render(config.range));
        break;
      case 'create':
        const title = render(config.title || 'New Spreadsheet');
        const res = await axios.post('https://sheets.googleapis.com/v4/spreadsheets', { properties: { title } }, { headers });
        result = { spreadsheetId: res.data.spreadsheetId, url: res.data.spreadsheetUrl };
        break;
      default:
        throw new Error(`Unknown Sheets operation: ${operation}`);
    }

    return { status: 'success', data: result };
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message;
    throw new Error(`[Sheets Error] ${msg}`);
  }
};
