import type { NodeDefinition } from '../../types.js';

export const calendarNode: NodeDefinition = {
  id: 'google.calendar',
  label: 'Google Calendar',
  name: 'Calendar',
  category: 'Tools',
  variant: 'connector',
  description: 'Complete Google Calendar integration - manage events, attendees, calendars, reminders, and searches.',
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
    { key: 'resource', label: 'Resource Type', type: 'select', options: ['event', 'calendar', 'attendee', 'reminder', 'search'] },
    { key: 'operation', label: 'Operation', type: 'select', options: ['listEvents', 'getEvent', 'createEvent', 'updateEvent', 'deleteEvent', 'moveEvent', 'addAttendee', 'removeAttendee', 'getAttendee', 'respondToInvite', 'listCalendars', 'getCalendar', 'createCalendar', 'updateCalendar', 'deleteCalendar', 'shareCalendar', 'addReminder', 'removeReminder', 'updateReminder', 'searchEvents', 'findFreeTime', 'listBusyTimes'], default: 'listEvents' },
  ],
  operationInputs: {
    listEvents: [
      { key: 'calendarId', label: 'Calendar', type: 'string', required: true, default: 'primary', description: 'Calendar to fetch events from', dynamicProvider: 'google', dynamicResource: 'calendar' },
    ],
    getEvent: [
      { key: 'calendarId', label: 'Calendar', type: 'string', required: true, default: 'primary', description: 'Calendar containing the event', dynamicProvider: 'google', dynamicResource: 'calendar' },
      { key: 'eventId', label: 'Event ID', type: 'string', required: true, description: 'ID of the event to fetch' },
    ],
    createEvent: [
      { key: 'calendarId', label: 'Calendar', type: 'string', required: true, default: 'primary', description: 'Calendar to create event in', dynamicProvider: 'google', dynamicResource: 'calendar' },
      { key: 'summary', label: 'Summary', type: 'string', required: true, description: 'Event title' },
      { key: 'start', label: 'Start Time', type: 'string', required: true, description: 'Event start (ISO string)' },
      { key: 'end', label: 'End Time', type: 'string', required: true, description: 'Event end (ISO string)' },
    ],
    deleteEvent: [
      { key: 'calendarId', label: 'Calendar', type: 'string', required: true, default: 'primary', description: 'Calendar containing the event', dynamicProvider: 'google', dynamicResource: 'calendar' },
      { key: 'eventId', label: 'Event ID', type: 'string', required: true, description: 'ID of the event to delete' },
    ],
    searchEvents: [
      { key: 'calendarId', label: 'Calendar', type: 'string', required: true, default: 'primary', description: 'Calendar to search in', dynamicProvider: 'google', dynamicResource: 'calendar' },
      { key: 'query', label: 'Query', type: 'string', required: true, description: 'Search query' },
    ],
  },
  operationOutputs: {
    listEvents: [
      { key: 'status', type: 'string' },
      { key: 'data.items[0].id', type: 'string' },
      { key: 'data.items[0].summary', type: 'string' },
      { key: 'data.items[0].start.dateTime', type: 'string' },
      { key: 'data.summary', type: 'string' },
    ],
    getEvent: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.htmlLink', type: 'string' },
      { key: 'data.summary', type: 'string' },
      { key: 'data.description', type: 'string' },
      { key: 'data.start.dateTime', type: 'string' },
      { key: 'data.end.dateTime', type: 'string' },
    ],
    createEvent: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.htmlLink', type: 'string' },
      { key: 'data.summary', type: 'string' },
    ],
    updateEvent: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.summary', type: 'string' },
    ],
    deleteEvent: [
      { key: 'status', type: 'string' },
    ],
    moveEvent: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
    addAttendee: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
    removeAttendee: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
    getAttendee: [
      { key: 'status', type: 'string' },
      { key: 'data.email', type: 'string' },
      { key: 'data.responseStatus', type: 'string' },
    ],
    respondToInvite: [
      { key: 'status', type: 'string' },
    ],
    listCalendars: [
      { key: 'status', type: 'string' },
      { key: 'data.items[0].id', type: 'string' },
      { key: 'data.items[0].summary', type: 'string' },
    ],
    getCalendar: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.summary', type: 'string' },
    ],
    createCalendar: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.summary', type: 'string' },
    ],
    updateCalendar: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
    deleteCalendar: [
      { key: 'status', type: 'string' },
    ],
    shareCalendar: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
    addReminder: [
      { key: 'status', type: 'string' },
    ],
    removeReminder: [
      { key: 'status', type: 'string' },
    ],
    updateReminder: [
      { key: 'status', type: 'string' },
    ],
    searchEvents: [
      { key: 'status', type: 'string' },
      { key: 'data.items[0].id', type: 'string' },
      { key: 'data.items[0].summary', type: 'string' },
    ],
    findFreeTime: [
      { key: 'status', type: 'string' },
      { key: 'data.busy[0].start', type: 'string' },
    ],
    listBusyTimes: [
      { key: 'status', type: 'string' },
      { key: 'data.busy[0].start', type: 'string' },
    ],
  },
  requiredInputs: [
    {
      key: 'operation',
      label: 'Operation',
      type: 'string',
      required: true,
      description: 'Calendar operation to perform',
      example: 'createEvent',
    },
  ],
  outputSchema: [
    { key: 'status', type: 'string', description: 'Operation status', example: 'success' },
    { key: 'data', type: 'any', description: 'Raw Google Calendar API response data', example: {} },
  ],
};
