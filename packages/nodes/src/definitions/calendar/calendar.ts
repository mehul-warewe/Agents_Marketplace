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
    {
      key: 'operation',
      label: 'Operation',
      type: 'select',
      options: ['listEvents', 'getEvent', 'createEvent', 'updateEvent', 'deleteEvent', 'moveEvent', 'addAttendee', 'removeAttendee', 'getAttendee', 'respondToInvite', 'listCalendars', 'getCalendar', 'createCalendar', 'updateCalendar', 'deleteCalendar', 'shareCalendar', 'addReminder', 'removeReminder', 'updateReminder', 'searchEvents', 'findFreeTime', 'listBusyTimes'],
    },
  ],
  operationInputs: {
    listEvents: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: false, description: 'Calendar to list from', example: 'primary' },
      { key: 'timeMin', label: 'From', type: 'string', required: false, description: 'ISO date', example: '2024-03-01T00:00:00Z' },
      { key: 'timeMax', label: 'To', type: 'string', required: false, description: 'ISO date', example: '2024-04-01T00:00:00Z' },
      { key: 'maxResults', label: 'Max Results', type: 'string', required: false, description: 'Limit', example: '10' },
      { key: 'query', label: 'Search', type: 'string', required: false, description: 'Filter text', example: 'meeting' },
    ],
    getEvent: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: false, description: 'Calendar ID', example: 'primary' },
      { key: 'eventId', label: 'Event ID', type: 'string', required: true, description: 'Event to fetch', example: 'abc123' },
    ],
    createEvent: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: false, description: 'Calendar to add to', example: 'primary' },
      { key: 'summary', label: 'Title', type: 'string', required: true, description: 'Event title', example: 'Team Meeting' },
      { key: 'startTime', label: 'Start Time', type: 'string', required: true, description: 'ISO format', example: '2024-03-20T10:00:00Z' },
      { key: 'endTime', label: 'End Time', type: 'string', required: true, description: 'ISO format', example: '2024-03-20T11:00:00Z' },
      { key: 'description', label: 'Description', type: 'string', required: false, description: 'Event details', example: 'Agenda...' },
      { key: 'location', label: 'Location', type: 'string', required: false, description: 'Event location', example: 'Conference Room' },
      { key: 'attendees', label: 'Attendees', type: 'array', required: false, description: 'Emails', example: ['user@example.com'] },
    ],
    updateEvent: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: false, description: 'Calendar ID', example: 'primary' },
      { key: 'eventId', label: 'Event ID', type: 'string', required: true, description: 'Event to update', example: 'abc123' },
      { key: 'summary', label: 'Title', type: 'string', required: false, description: 'New title', example: 'Updated Meeting' },
      { key: 'startTime', label: 'Start Time', type: 'string', required: false, description: 'ISO format', example: '2024-03-20T10:00:00Z' },
      { key: 'endTime', label: 'End Time', type: 'string', required: false, description: 'ISO format', example: '2024-03-20T11:00:00Z' },
      { key: 'description', label: 'Description', type: 'string', required: false, description: 'New details', example: 'Updated agenda' },
      { key: 'location', label: 'Location', type: 'string', required: false, description: 'New location', example: 'Room B' },
    ],
    deleteEvent: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: false, description: 'Calendar ID', example: 'primary' },
      { key: 'eventId', label: 'Event ID', type: 'string', required: true, description: 'Event to delete', example: 'abc123' },
    ],
    moveEvent: [
      { key: 'calendarId', label: 'Current Calendar', type: 'string', required: false, description: 'From calendar', example: 'primary' },
      { key: 'eventId', label: 'Event ID', type: 'string', required: true, description: 'Event to move', example: 'abc123' },
      { key: 'destination', label: 'Destination Calendar', type: 'string', required: true, description: 'Target calendar', example: 'work' },
    ],
    addAttendee: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: false, description: 'Calendar ID', example: 'primary' },
      { key: 'eventId', label: 'Event ID', type: 'string', required: true, description: 'Event', example: 'abc123' },
      { key: 'attendeeEmail', label: 'Attendee Email', type: 'string', required: true, description: 'Email to add', example: 'user@example.com' },
    ],
    removeAttendee: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: false, description: 'Calendar ID', example: 'primary' },
      { key: 'eventId', label: 'Event ID', type: 'string', required: true, description: 'Event', example: 'abc123' },
      { key: 'attendeeEmail', label: 'Attendee Email', type: 'string', required: true, description: 'Email to remove', example: 'user@example.com' },
    ],
    getAttendee: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: false, description: 'Calendar ID', example: 'primary' },
      { key: 'eventId', label: 'Event ID', type: 'string', required: true, description: 'Event', example: 'abc123' },
      { key: 'attendeeEmail', label: 'Attendee Email', type: 'string', required: true, description: 'Email to get', example: 'user@example.com' },
    ],
    respondToInvite: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: false, description: 'Calendar ID', example: 'primary' },
      { key: 'eventId', label: 'Event ID', type: 'string', required: true, description: 'Event invite', example: 'abc123' },
      { key: 'response', label: 'Response', type: 'string', required: true, description: 'accept, decline, or tentative', example: 'accept' },
    ],
    listCalendars: [
    ],
    getCalendar: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: true, description: 'Calendar to fetch', example: 'primary' },
    ],
    createCalendar: [
      { key: 'summary', label: 'Calendar Name', type: 'string', required: true, description: 'New calendar name', example: 'Projects' },
      { key: 'description', label: 'Description', type: 'string', required: false, description: 'Calendar description', example: 'Project timelines' },
      { key: 'timezone', label: 'Timezone', type: 'string', required: false, description: 'Timezone', example: 'UTC' },
    ],
    updateCalendar: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: true, description: 'Calendar to update', example: 'primary' },
      { key: 'summary', label: 'Name', type: 'string', required: false, description: 'New name', example: 'Work Projects' },
      { key: 'description', label: 'Description', type: 'string', required: false, description: 'New description', example: 'Updated description' },
    ],
    deleteCalendar: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: true, description: 'Calendar to delete', example: 'primary' },
    ],
    shareCalendar: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: true, description: 'Calendar to share', example: 'primary' },
      { key: 'userEmail', label: 'User Email', type: 'string', required: true, description: 'Email to share with', example: 'user@example.com' },
      { key: 'role', label: 'Role', type: 'string', required: true, description: 'reader, writer, or owner', example: 'reader' },
    ],
    addReminder: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: false, description: 'Calendar ID', example: 'primary' },
      { key: 'eventId', label: 'Event ID', type: 'string', required: true, description: 'Event', example: 'abc123' },
      { key: 'minutes', label: 'Minutes Before', type: 'string', required: true, description: 'Reminder time', example: '15' },
      { key: 'type', label: 'Type', type: 'string', required: false, description: 'alert, email, or notification', example: 'alert' },
    ],
    removeReminder: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: false, description: 'Calendar ID', example: 'primary' },
      { key: 'eventId', label: 'Event ID', type: 'string', required: true, description: 'Event', example: 'abc123' },
      { key: 'minutes', label: 'Minutes Before', type: 'string', required: true, description: 'Reminder to remove', example: '15' },
    ],
    updateReminder: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: false, description: 'Calendar ID', example: 'primary' },
      { key: 'eventId', label: 'Event ID', type: 'string', required: true, description: 'Event', example: 'abc123' },
      { key: 'oldMinutes', label: 'Old Minutes', type: 'string', required: true, description: 'Current reminder', example: '15' },
      { key: 'newMinutes', label: 'New Minutes', type: 'string', required: true, description: 'New reminder time', example: '30' },
    ],
    searchEvents: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: false, description: 'Calendar to search', example: 'primary' },
      { key: 'query', label: 'Search Query', type: 'string', required: true, description: 'Search term', example: 'meeting' },
      { key: 'maxResults', label: 'Max Results', type: 'string', required: false, description: 'Limit', example: '10' },
    ],
    findFreeTime: [
      { key: 'attendees', label: 'Attendees', type: 'array', required: true, description: 'Emails', example: ['user1@example.com', 'user2@example.com'] },
      { key: 'timeMin', label: 'From', type: 'string', required: true, description: 'ISO date', example: '2024-03-20T00:00:00Z' },
      { key: 'timeMax', label: 'To', type: 'string', required: true, description: 'ISO date', example: '2024-03-25T00:00:00Z' },
      { key: 'duration', label: 'Duration (minutes)', type: 'string', required: true, description: 'Meeting length', example: '60' },
    ],
    listBusyTimes: [
      { key: 'calendarId', label: 'Calendar ID', type: 'string', required: false, description: 'Calendar ID', example: 'primary' },
      { key: 'timeMin', label: 'From', type: 'string', required: true, description: 'ISO date', example: '2024-03-20T00:00:00Z' },
      { key: 'timeMax', label: 'To', type: 'string', required: true, description: 'ISO date', example: '2024-03-25T00:00:00Z' },
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
    { key: 'eventId', type: 'string', description: 'Event ID', example: 'abc123' },
    { key: 'summary', type: 'string', description: 'Event title', example: 'Team Meeting' },
    { key: 'startTime', type: 'string', description: 'Start time', example: '2024-03-20T10:00:00Z' },
    { key: 'htmlLink', type: 'string', description: 'Calendar link', example: 'https://calendar.google.com...' },
    { key: 'status', type: 'string', description: 'Operation status', example: 'success' },
  ],
};
