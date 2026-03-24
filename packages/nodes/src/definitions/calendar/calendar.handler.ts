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

    default:
      throw new Error(`Unknown Google Calendar operation: ${operation}`);
  }
};
