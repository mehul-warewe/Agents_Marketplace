import type { NodeDefinition } from '../../types.js';

export const sheetsNode: NodeDefinition = {
  id: 'google.sheets',
  label: 'Google Sheets',
  name: 'Sheets',
  category: 'Tools',
  variant: 'connector',
  description: 'Complete Google Sheets integration - manage sheets, cells, formatting, formulas, and data operations.',
  icon: '/iconSvg/google-sheets-icon.svg',
  color: '#34a853',
  bg: 'bg-[#34a853]/10',
  border: 'border-[#34a853]/20',
  isTrigger: false,
  executionKey: 'google_sheets',
  usableAsTool: true,
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'any', position: 'right' }],
  credentialTypes: ['google_sheets_oauth'],
  configFields: [
    {
      key: 'auth_notice',
      label: 'Note: Ensure your Google account is connected to allow authentication for this node.',
      type: 'notice',
    },
    { key: 'resource', label: 'Resource Type', type: 'select', options: ['spreadsheet', 'sheet', 'cell', 'format', 'formula', 'data'] },
    {
      key: 'operation',
      label: 'Operation',
      type: 'select',
      options: ['createSheet', 'deleteSheet', 'listSheets', 'renameSheet', 'duplicateSheet', 'readCell', 'readRange', 'readSheet', 'writeCell', 'writeRange', 'appendRow', 'appendRows', 'insertRow', 'deleteRow', 'insertColumn', 'deleteColumn', 'clearRange', 'formatCell', 'setColumnWidth', 'setRowHeight', 'freezeRows', 'mergeCell', 'addFormula', 'updateFormula', 'copyFormula', 'sortRange', 'filterRange', 'createChart', 'createPivotTable', 'append', 'read', 'update', 'clear', 'create'],
    },
  ],
  operationInputs: {
    createSheet: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'title', label: 'Sheet Title', type: 'string', required: true, description: 'New sheet name', example: 'Data' },
    ],
    deleteSheet: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'sheetId', label: 'Sheet ID', type: 'string', required: true, description: 'Sheet to delete', example: '0' },
    ],
    listSheets: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
    ],
    renameSheet: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'sheetId', label: 'Sheet ID', type: 'string', required: true, description: 'Sheet to rename', example: '0' },
      { key: 'newName', label: 'New Name', type: 'string', required: true, description: 'New sheet name', example: 'Results' },
    ],
    duplicateSheet: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'sheetId', label: 'Sheet ID', type: 'string', required: true, description: 'Sheet to duplicate', example: '0' },
    ],
    readCell: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'range', label: 'Cell Range', type: 'string', required: true, description: 'Cell reference', example: 'Sheet1!A1' },
    ],
    readRange: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'range', label: 'Range', type: 'string', required: true, description: 'Range to read', example: 'Sheet1!A1:D20' },
    ],
    readSheet: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'sheetName', label: 'Sheet Name', type: 'string', required: true, description: 'Sheet to read', example: 'Sheet1' },
    ],
    writeCell: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'range', label: 'Cell Range', type: 'string', required: true, description: 'Cell reference', example: 'Sheet1!A1' },
      { key: 'value', label: 'Value', type: 'string', required: true, description: 'Cell value', example: 'Hello' },
    ],
    writeRange: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'range', label: 'Range', type: 'string', required: true, description: 'Range to update', example: 'Sheet1!A1:C1' },
      { key: 'values', label: 'Values', type: 'array', required: true, description: 'Values to write', example: [['Name', 'Age']] },
    ],
    appendRow: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'range', label: 'Sheet/Range', type: 'string', required: true, description: 'Where to append', example: 'Sheet1!A1' },
      { key: 'values', label: 'Row Values', type: 'array', required: true, description: 'Row data', example: ['value1', 'value2'] },
    ],
    appendRows: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'range', label: 'Sheet/Range', type: 'string', required: true, description: 'Where to append', example: 'Sheet1!A1' },
      { key: 'values', label: 'Rows', type: 'array', required: true, description: 'Multiple rows', example: [['v1', 'v2'], ['v3', 'v4']] },
    ],
    insertRow: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'sheetId', label: 'Sheet ID', type: 'string', required: true, description: 'Sheet ID', example: '0' },
      { key: 'index', label: 'Row Index', type: 'string', required: true, description: 'Insert position', example: '5' },
      { key: 'values', label: 'Row Values', type: 'array', required: false, description: 'Row data', example: ['v1', 'v2'] },
    ],
    deleteRow: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'sheetId', label: 'Sheet ID', type: 'string', required: true, description: 'Sheet ID', example: '0' },
      { key: 'index', label: 'Row Index', type: 'string', required: true, description: 'Row to delete', example: '5' },
    ],
    insertColumn: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'sheetId', label: 'Sheet ID', type: 'string', required: true, description: 'Sheet ID', example: '0' },
      { key: 'index', label: 'Column Index', type: 'string', required: true, description: 'Insert position', example: '3' },
    ],
    deleteColumn: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'sheetId', label: 'Sheet ID', type: 'string', required: true, description: 'Sheet ID', example: '0' },
      { key: 'index', label: 'Column Index', type: 'string', required: true, description: 'Column to delete', example: '3' },
    ],
    clearRange: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'range', label: 'Range', type: 'string', required: true, description: 'Range to clear', example: 'Sheet1!A1:Z100' },
    ],
    formatCell: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'range', label: 'Range', type: 'string', required: true, description: 'Cells to format', example: 'Sheet1!A1:B5' },
      { key: 'format', label: 'Format (JSON)', type: 'string', required: true, description: 'Format spec', example: '{"bold":true,"fontSize":12}' },
    ],
    setColumnWidth: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'sheetId', label: 'Sheet ID', type: 'string', required: true, description: 'Sheet ID', example: '0' },
      { key: 'columnIndex', label: 'Column Index', type: 'string', required: true, description: 'Column', example: '0' },
      { key: 'width', label: 'Width', type: 'string', required: true, description: 'Pixels', example: '200' },
    ],
    setRowHeight: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'sheetId', label: 'Sheet ID', type: 'string', required: true, description: 'Sheet ID', example: '0' },
      { key: 'rowIndex', label: 'Row Index', type: 'string', required: true, description: 'Row', example: '0' },
      { key: 'height', label: 'Height', type: 'string', required: true, description: 'Pixels', example: '30' },
    ],
    freezeRows: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'sheetId', label: 'Sheet ID', type: 'string', required: true, description: 'Sheet ID', example: '0' },
      { key: 'rowCount', label: 'Row Count', type: 'string', required: true, description: 'Rows to freeze', example: '1' },
    ],
    mergeCell: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'range', label: 'Range', type: 'string', required: true, description: 'Cells to merge', example: 'Sheet1!A1:B2' },
    ],
    addFormula: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'range', label: 'Cell', type: 'string', required: true, description: 'Cell for formula', example: 'Sheet1!C1' },
      { key: 'formula', label: 'Formula', type: 'string', required: true, description: 'Formula text', example: '=SUM(A1:B1)' },
    ],
    updateFormula: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'range', label: 'Cell', type: 'string', required: true, description: 'Cell with formula', example: 'Sheet1!C1' },
      { key: 'formula', label: 'New Formula', type: 'string', required: true, description: 'Updated formula', example: '=SUM(A1:D1)' },
    ],
    copyFormula: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'source', label: 'Source Cell', type: 'string', required: true, description: 'Cell with formula', example: 'Sheet1!C1' },
      { key: 'destination', label: 'Destination Range', type: 'string', required: true, description: 'Where to copy', example: 'Sheet1!C2:C10' },
    ],
    sortRange: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'range', label: 'Range', type: 'string', required: true, description: 'Data to sort', example: 'Sheet1!A1:D20' },
      { key: 'column', label: 'Sort Column', type: 'string', required: true, description: 'Column index', example: '0' },
      { key: 'ascending', label: 'Ascending', type: 'string', required: false, description: 'true or false', example: 'true' },
    ],
    filterRange: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'range', label: 'Range', type: 'string', required: true, description: 'Data range', example: 'Sheet1!A1:D20' },
      { key: 'criteria', label: 'Filter Criteria', type: 'string', required: true, description: 'Filter spec (JSON)', example: '{"column":0,"condition":"contains","value":"text"}' },
    ],
    createChart: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'sheetId', label: 'Sheet ID', type: 'string', required: true, description: 'Sheet to place chart', example: '0' },
      { key: 'dataRange', label: 'Data Range', type: 'string', required: true, description: 'Chart data', example: 'Sheet1!A1:D10' },
      { key: 'chartType', label: 'Chart Type', type: 'string', required: true, description: 'bar, pie, line, etc.', example: 'COLUMN' },
    ],
    createPivotTable: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'sourceRange', label: 'Source Range', type: 'string', required: true, description: 'Data source', example: 'Sheet1!A1:D100' },
      { key: 'destinationSheetId', label: 'Dest. Sheet ID', type: 'string', required: true, description: 'Target sheet', example: '0' },
    ],
    append: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'range', label: 'Range', type: 'string', required: true, description: 'Sheet range', example: 'Sheet1!A1' },
      { key: 'values', label: 'Values', type: 'array', required: true, description: 'Row data', example: ['v1', 'v2'] },
    ],
    read: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'range', label: 'Range', type: 'string', required: true, description: 'Range to read', example: 'Sheet1!A1:D20' },
    ],
    update: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'range', label: 'Range', type: 'string', required: true, description: 'Range to update', example: 'Sheet1!A1:C1' },
      { key: 'values', label: 'Values', type: 'array', required: true, description: 'New values', example: [['Name', 'Age']] },
    ],
    clear: [
      { key: 'spreadsheetId', label: 'Spreadsheet', type: 'string', required: true, description: 'Select spreadsheet', example: '1BxiMV...', dynamicProvider: 'google', dynamicResource: 'spreadsheet' },
      { key: 'range', label: 'Range', type: 'string', required: true, description: 'Range to clear', example: 'Sheet1!A1:Z100' },
    ],
    create: [
      { key: 'title', label: 'Title', type: 'string', required: true, description: 'Spreadsheet title', example: 'My Sheet' },
    ],
  },
  operationOutputs: {
    createSheet: [
      { key: 'status', type: 'string' },
      { key: 'data.spreadsheetId', type: 'string' },
      { key: 'data.replies[0].addSheet.properties.title', type: 'string' },
      { key: 'data.replies[0].addSheet.properties.sheetId', type: 'number' },
    ],
    deleteSheet: [
      { key: 'status', type: 'string' },
    ],
    listSheets: [
      { key: 'status', type: 'string' },
      { key: 'data.sheets[0].properties.title', type: 'string' },
      { key: 'data.sheets[0].properties.sheetId', type: 'number' },
    ],
    renameSheet: [
      { key: 'status', type: 'string' },
    ],
    duplicateSheet: [
      { key: 'status', type: 'string' },
    ],
    readCell: [
      { key: 'status', type: 'string' },
      { key: 'data.values[0][0]', type: 'string' },
    ],
    readRange: [
      { key: 'status', type: 'string' },
      { key: 'data.values[0]', type: 'array' },
      { key: 'data.values[0][0]', type: 'string' },
    ],
    readSheet: [
      { key: 'status', type: 'string' },
      { key: 'data.values[0]', type: 'array' },
    ],
    writeCell: [
      { key: 'status', type: 'string' },
      { key: 'data.updatedRange', type: 'string' },
      { key: 'data.updatedCells', type: 'number' },
    ],
    writeRange: [
      { key: 'status', type: 'string' },
      { key: 'data.updatedRange', type: 'string' },
      { key: 'data.updatedCells', type: 'number' },
    ],
    appendRow: [
      { key: 'status', type: 'string' },
      { key: 'data.updates.updatedRange', type: 'string' },
      { key: 'data.updates.updatedRows', type: 'number' },
    ],
    appendRows: [
      { key: 'status', type: 'string' },
      { key: 'data.updates.updatedRange', type: 'string' },
    ],
    insertRow: [
      { key: 'status', type: 'string' },
    ],
    deleteRow: [
      { key: 'status', type: 'string' },
    ],
    insertColumn: [
      { key: 'status', type: 'string' },
    ],
    deleteColumn: [
      { key: 'status', type: 'string' },
    ],
    clearRange: [
      { key: 'status', type: 'string' },
      { key: 'data.clearedRange', type: 'string' },
    ],
    formatCell: [
      { key: 'status', type: 'string' },
    ],
    setColumnWidth: [
      { key: 'status', type: 'string' },
    ],
    setRowHeight: [
      { key: 'status', type: 'string' },
    ],
    freezeRows: [
      { key: 'status', type: 'string' },
    ],
    mergeCell: [
      { key: 'status', type: 'string' },
    ],
    addFormula: [
      { key: 'status', type: 'string' },
    ],
    updateFormula: [
      { key: 'status', type: 'string' },
    ],
    copyFormula: [
      { key: 'status', type: 'string' },
    ],
    sortRange: [
      { key: 'status', type: 'string' },
    ],
    filterRange: [
      { key: 'status', type: 'string' },
    ],
    createChart: [
      { key: 'status', type: 'string' },
    ],
    createPivotTable: [
      { key: 'status', type: 'string' },
    ],
    append: [
      { key: 'status', type: 'string' },
      { key: 'data.updates.updatedRange', type: 'string' },
    ],
    read: [
      { key: 'status', type: 'string' },
      { key: 'data.values[0]', type: 'array' },
    ],
    update: [
      { key: 'status', type: 'string' },
      { key: 'data.updatedRange', type: 'string' },
    ],
    clear: [
      { key: 'status', type: 'string' },
    ],
    create: [
      { key: 'status', type: 'string' },
      { key: 'data.spreadsheetId', type: 'string' },
      { key: 'data.spreadsheetUrl', type: 'string' },
    ],
  },
  requiredInputs: [
    {
      key: 'operation',
      label: 'Operation',
      type: 'string',
      required: true,
      description: 'Sheets operation to perform',
      example: 'append',
    },
  ],
  outputSchema: [
    { key: 'status', type: 'string', description: 'Operation status', example: 'success' },
    { key: 'data', type: 'any', description: 'Operational result' },
  ],
};
