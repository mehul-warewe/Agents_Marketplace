import type { NodeDefinition } from '../../types.js';

export const sheetsNode: NodeDefinition = {
  id: 'google.sheets',
  label: 'Google Sheets',
  name: 'Sheets',
  category: 'Tools',
  variant: 'connector',
  description: 'Append, read, update, clear, or create Google Sheets spreadsheets.',
  icon: '/iconSvg/google-sheets-icon.svg',
  color: '#34a853',
  bg: 'bg-[#34a853]/10',
  border: 'border-[#34a853]/20',
  isTrigger: false,
  executionKey: 'google_sheets',
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'data', position: 'right' }],
  credentialTypes: ['google_sheets_oauth'],
  configFields: [
    {
      key: 'auth_notice',
      label: 'Note: Ensure your Google account is connected to allow authentication for this node.',
      type: 'notice',
    },
    { key: 'resource', label: 'Resource', type: 'select', options: ['spreadsheet', 'sheet'] },
    {
      key: 'operation',
      label: 'Operation',
      type: 'select',
      options: ['append', 'read', 'update', 'clear', 'create'],
    },
  ],
  operationFields: {
    append: [
      { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', placeholder: 'ID from the URL' },
      { key: 'range', label: 'Sheet / Range', type: 'text', placeholder: 'Sheet1!A1' },
      { key: 'values', label: 'Row Values', type: 'textarea', placeholder: 'val1, val2  or  ["val1","val2"]' },
    ],
    read: [
      { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', placeholder: 'ID from the URL' },
      { key: 'range', label: 'Range', type: 'text', placeholder: 'Sheet1!A1:D20 or Sheet1' },
    ],
    update: [
      { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', placeholder: 'ID from the URL' },
      { key: 'range', label: 'Range', type: 'text', placeholder: 'Sheet1!A1:C1' },
      { key: 'values', label: 'Values (JSON)', type: 'textarea', placeholder: '[["Name","Age"],["Alice",30]]' },
    ],
    clear: [
      { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', placeholder: 'ID from the URL' },
      { key: 'range', label: 'Range to Clear', type: 'text', placeholder: 'Sheet1!A1:Z100 or Sheet1' },
    ],
    create: [
      { key: 'title', label: 'Spreadsheet Title', type: 'text', placeholder: 'My New Spreadsheet' },
    ],
  },
};
