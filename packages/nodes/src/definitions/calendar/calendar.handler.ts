import axios from 'axios';
import type { ToolHandler, ToolContext } from '../../types.js';

export const calendarHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;
  const operation = config.operation;
  const token = credentials?.accessToken;
  if (!token) throw new Error('Google Calendar node requires a valid Google OAuth2 credential.');

  const headers = { Authorization: `Bearer ${token}` };

  switch (operation) {
    case 'create': {
      const summary = render(config.summary);
      const description = render(config.description || '');
      const start = render(config.startTime);
      const end = render(config.endTime);
      const attendees = render(config.attendees || '');
      const location = render(config.location || '');
      const event: any = {
        summary,
        description,
        location,
        start: { dateTime: start, timeZone: 'UTC' },
        end: { dateTime: end, timeZone: 'UTC' },
      };
      if (attendees) {
        event.attendees = attendees.split(',').map((e: string) => ({ email: e.trim() }));
      }
      const res = await axios.post(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        event,
        { headers },
      );
      return { success: true, eventId: res.data.id, link: res.data.htmlLink };
    }

    case 'list': {
      const timeMin = render(config.timeMin || new Date().toISOString());
      const timeMax = render(config.timeMax || '');
      const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;
      const query = render(config.query || '');
      const params: any = { timeMin, maxResults, singleEvents: true, orderBy: 'startTime' };
      if (timeMax) params.timeMax = timeMax;
      if (query) params.q = query;
      const res = await axios.get(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        { params, headers },
      );
      return { success: true, events: res.data.items || [] };
    }

    case 'update': {
      const eventId = render(config.eventId);
      const patch: any = {};
      if (config.summary) patch.summary = render(config.summary);
      if (config.description) patch.description = render(config.description);
      if (config.startTime) patch.start = { dateTime: render(config.startTime), timeZone: 'UTC' };
      if (config.endTime) patch.end = { dateTime: render(config.endTime), timeZone: 'UTC' };
      const res = await axios.patch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        patch,
        { headers },
      );
      return { success: true, eventId: res.data.id, link: res.data.htmlLink };
    }

    case 'delete': {
      const eventId = render(config.eventId);
      await axios.delete(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, { headers });
      return { success: true, eventId, deleted: true };
    }

    case 'get': {
      const eventId = render(config.eventId);
      const res = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, { headers });
      return { success: true, ...res.data };
    }

    case 'moveEvent': {
      const eventId = render(config.eventId);
      const fromCal = render(config.calendarId || 'primary');
      const destCal = render(config.destination);
      const res = await axios.post(
        `https://www.googleapis.com/calendar/v3/calendars/${fromCal}/events/${eventId}/move?destination=${destCal}`,
        {},
        { headers },
      );
      return { success: true, eventId: res.data.id, movedTo: destCal };
    }

    case 'addAttendee': {
      const eventId = render(config.eventId);
      const email = render(config.attendeeEmail);
      const res = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, { headers });
      const attendees = res.data.attendees || [];
      attendees.push({ email });
      const updateRes = await axios.patch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        { attendees },
        { headers },
      );
      return { success: true, eventId, attendeeAdded: email };
    }

    case 'removeAttendee': {
      const eventId = render(config.eventId);
      const email = render(config.attendeeEmail);
      const res = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, { headers });
      const attendees = (res.data.attendees || []).filter((a: any) => a.email !== email);
      await axios.patch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        { attendees },
        { headers },
      );
      return { success: true, eventId, attendeeRemoved: email };
    }

    case 'getAttendee': {
      const eventId = render(config.eventId);
      const email = render(config.attendeeEmail);
      const res = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, { headers });
      const attendee = (res.data.attendees || []).find((a: any) => a.email === email);
      return { success: true, attendee: attendee || null };
    }

    case 'respondToInvite': {
      const eventId = render(config.eventId);
      const response = render(config.response);
      await axios.patch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}/setResponse`,
        {},
        { params: { answer: response }, headers },
      );
      return { success: true, eventId, responded: response };
    }

    case 'listCalendars': {
      const res = await axios.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', { headers });
      return { success: true, calendars: res.data.items || [] };
    }

    case 'getCalendar': {
      const calendarId = render(config.calendarId || 'primary');
      const res = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}`, { headers });
      return { success: true, calendar: res.data };
    }

    case 'createCalendar': {
      const summary = render(config.summary);
      const description = render(config.description || '');
      const timezone = render(config.timezone || 'UTC');
      const res = await axios.post(
        'https://www.googleapis.com/calendar/v3/calendars',
        { summary, description, timeZone: timezone },
        { headers },
      );
      return { success: true, calendarId: res.data.id };
    }

    case 'updateCalendar': {
      const calendarId = render(config.calendarId);
      const patch: any = {};
      if (config.summary) patch.summary = render(config.summary);
      if (config.description) patch.description = render(config.description);
      const res = await axios.patch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}`, patch, { headers });
      return { success: true, calendarId: res.data.id };
    }

    case 'deleteCalendar': {
      const calendarId = render(config.calendarId);
      await axios.delete(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}`, { headers });
      return { success: true, calendarId, deleted: true };
    }

    case 'shareCalendar': {
      const calendarId = render(config.calendarId);
      const email = render(config.userEmail);
      const role = render(config.role || 'reader');
      const res = await axios.post(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/acl`,
        { scope: { type: 'user', value: email }, role },
        { headers },
      );
      return { success: true, ruleId: res.data.id, sharedWith: email };
    }

    case 'addReminder': {
      const eventId = render(config.eventId);
      const minutes = parseInt(render(config.minutes || '15'), 10);
      const type = render(config.type || 'alert');
      const res = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, { headers });
      const reminders = res.data.reminders || { useDefault: false, overrides: [] };
      reminders.overrides = reminders.overrides || [];
      reminders.overrides.push({ method: type, minutes });
      await axios.patch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        { reminders },
        { headers },
      );
      return { success: true, eventId, reminderAdded: true, minutes };
    }

    case 'removeReminder': {
      const eventId = render(config.eventId);
      const minutes = parseInt(render(config.minutes || '15'), 10);
      const res = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, { headers });
      const reminders = res.data.reminders || { useDefault: false, overrides: [] };
      reminders.overrides = (reminders.overrides || []).filter((r: any) => r.minutes !== minutes);
      await axios.patch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        { reminders },
        { headers },
      );
      return { success: true, eventId, reminderRemoved: true };
    }

    case 'searchEvents': {
      const calendarId = render(config.calendarId || 'primary');
      const query = render(config.query);
      const maxResults = parseInt(render(config.maxResults || '10'), 10);
      const res = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
        params: { q: query, maxResults, singleEvents: true },
        headers,
      });
      return { success: true, events: res.data.items || [] };
    }

    case 'findFreeTime': {
      const attendees = (render(config.attendees) || '').split(',').map(e => e.trim());
      const timeMin = render(config.timeMin);
      const timeMax = render(config.timeMax);
      const duration = parseInt(render(config.duration || '60'), 10);
      // This would require checking all attendees' calendars - simplified version
      return { success: true, message: 'Free time search requires calendar:readonly scope for all attendees' };
    }

    case 'listBusyTimes': {
      const calendarId = render(config.calendarId || 'primary');
      const timeMin = render(config.timeMin);
      const timeMax = render(config.timeMax);
      const res = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
        params: { timeMin, timeMax, singleEvents: true },
        headers,
      });
      const busyEvents = res.data.items || [];
      return { success: true, busyTimes: busyEvents.map((e: any) => ({ start: e.start, end: e.end, summary: e.summary })) };
    }

    default:
      throw new Error(`Unknown Google Calendar operation: ${operation}`);
  }
};
