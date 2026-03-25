import type { NodeDefinition } from '../../types.js';

export const calendarNode: NodeDefinition = {
  id: 'google.calendar',
  label: 'Google Calendar',
  name: 'Calendar',
  category: 'Tools',
  variant: 'connector',
  description: 'Create, list, update, get, or delete events in Google Calendar.',
  icon: '/iconSvg/google-calendar.svg',
  color: '#4285f4',
  bg: 'bg-[#4285f4]/10',
  border: 'border-[#4285f4]/20',
  isTrigger: false,
  executionKey: 'google_calendar',
  usableAsTool: true,
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'any', position: 'right' }],
  credentialTypes: ['google_calendar_oauth'],
  configFields: [
    {
      key: 'auth_notice',
      label: 'Note: Ensure your Google account is connected to allow authentication for this node.',
      type: 'notice',
    },
    { key: 'resource', label: 'Resource', type: 'select', options: ['event'] },
    {
      key: 'operation',
      label: 'Operation',
      type: 'select',
      options: ['create', 'list', 'get', 'update', 'delete'],
    },
  ],
  operationFields: {
    create: [
      { key: 'summary', label: 'Event Title', type: 'text', placeholder: 'Team Meeting' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Agenda...' },
      { key: 'startTime', label: 'Start Time (ISO)', type: 'text', placeholder: '2024-03-20T10:00:00Z' },
      { key: 'endTime', label: 'End Time (ISO)', type: 'text', placeholder: '2024-03-20T11:00:00Z' },
      { key: 'location', label: 'Location (optional)', type: 'text', placeholder: 'Conference Room A' },
      { key: 'attendees', label: 'Attendees (comma-separated emails)', type: 'text', placeholder: 'alice@example.com, bob@example.com' },
    ],
    list: [
      { key: 'timeMin', label: 'From (ISO, default: now)', type: 'text', placeholder: '2024-03-01T00:00:00Z' },
      { key: 'timeMax', label: 'To (ISO, optional)', type: 'text', placeholder: '2024-04-01T00:00:00Z' },
      { key: 'maxResults', label: 'Max Results', type: 'text', placeholder: '10' },
      { key: 'query', label: 'Search Filter (optional)', type: 'text', placeholder: 'meeting' },
    ],
    get: [
      { key: 'eventId', label: 'Event ID', type: 'text', placeholder: 'abc123...' },
    ],
    update: [
      { key: 'eventId', label: 'Event ID', type: 'text', placeholder: 'abc123...' },
      { key: 'summary', label: 'New Title', type: 'text', placeholder: 'Updated Meeting' },
      { key: 'description', label: 'New Description', type: 'textarea', placeholder: 'Updated agenda...' },
      { key: 'startTime', label: 'New Start (ISO)', type: 'text', placeholder: '2024-03-20T10:00:00Z' },
      { key: 'endTime', label: 'New End (ISO)', type: 'text', placeholder: '2024-03-20T11:00:00Z' },
      { key: 'location', label: 'New Location', type: 'text', placeholder: 'Room B' },
      { key: 'attendees', label: 'New Attendees', type: 'text', placeholder: 'alice@example.com, bob@example.com' },
    ],
    delete: [
      { key: 'eventId', label: 'Event ID', type: 'text', placeholder: 'abc123...' },
    ],
  },
};
