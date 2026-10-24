/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Google Calendar REST API v3 Client Service (calendar.googleapis.com)
 */

import { getAccessToken } from "./googleAuth";

export interface CalendarEventDateTime {
  dateTime?: string; // ISO 8601 string, e.g. "2026-10-21T10:00:00+05:30"
  date?: string; // "YYYY-MM-DD" for all-day events
  timeZone?: string;
}

export interface CalendarEventAttendee {
  email: string;
  displayName?: string;
  responseStatus?: "needsAction" | "declined" | "tentative" | "accepted";
  self?: boolean;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: CalendarEventDateTime;
  end: CalendarEventDateTime;
  attendees?: CalendarEventAttendee[];
  htmlLink?: string;
  hangoutLink?: string; // Google Meet link
  status?: string;
  colorId?: string;
  created?: string;
  updated?: string;
  isAllDay?: boolean;
}

export interface CalendarListEntry {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  timeZone?: string;
}

const CALENDAR_BASE_URL = "https://www.googleapis.com/calendar/v3";

export class GoogleCalendarApiClient {
  private async getAuthHeader(): Promise<{ Authorization: string }> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error("Authentication required. Please sign in with Google to access your Calendar.");
    }
    return { Authorization: `Bearer ${token}` };
  }

  // 1. List User's Calendars
  public async listCalendars(): Promise<CalendarListEntry[]> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${CALENDAR_BASE_URL}/users/me/calendarList`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch calendars: ${res.statusText}`);
    }
    const data = await res.json();
    return data.items || [];
  }

  // 2. List Events from a Calendar (defaults to primary)
  public async listEvents(
    calendarId: string = "primary",
    options?: {
      timeMin?: string;
      timeMax?: string;
      q?: string;
      maxResults?: number;
      singleEvents?: boolean;
      orderBy?: "startTime" | "updated";
    }
  ): Promise<CalendarEvent[]> {
    const headers = await this.getAuthHeader();
    const params = new URLSearchParams();

    params.set("singleEvents", String(options?.singleEvents ?? true));
    params.set("orderBy", options?.orderBy ?? "startTime");
    params.set("maxResults", String(options?.maxResults ?? 50));

    if (options?.timeMin) params.set("timeMin", options.timeMin);
    if (options?.timeMax) params.set("timeMax", options.timeMax);
    if (options?.q) params.set("q", options.q);

    const url = `${CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch calendar events: ${res.statusText}`);
    }

    const data = await res.json();
    const items = data.items || [];

    return items.map((item: any) => ({
      id: item.id,
      summary: item.summary || "(No title)",
      description: item.description,
      location: item.location,
      start: item.start || {},
      end: item.end || {},
      attendees: item.attendees,
      htmlLink: item.htmlLink,
      hangoutLink: item.hangoutLink,
      status: item.status,
      colorId: item.colorId,
      created: item.created,
      updated: item.updated,
      isAllDay: Boolean(item.start?.date && !item.start?.dateTime),
    }));
  }

  // 3. Get Single Event
  public async getEvent(calendarId: string = "primary", eventId: string): Promise<CalendarEvent> {
    const headers = await this.getAuthHeader();
    const url = `${CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch event: ${res.statusText}`);
    }
    const item = await res.json();
    return {
      id: item.id,
      summary: item.summary || "(No title)",
      description: item.description,
      location: item.location,
      start: item.start || {},
      end: item.end || {},
      attendees: item.attendees,
      htmlLink: item.htmlLink,
      hangoutLink: item.hangoutLink,
      status: item.status,
      colorId: item.colorId,
      created: item.created,
      updated: item.updated,
      isAllDay: Boolean(item.start?.date && !item.start?.dateTime),
    };
  }

  // 4. Create New Event (Supports Google Meet auto-link)
  public async createEvent(
    calendarId: string = "primary",
    params: {
      summary: string;
      description?: string;
      location?: string;
      start: CalendarEventDateTime;
      end: CalendarEventDateTime;
      attendees?: Array<{ email: string }>;
      addGoogleMeet?: boolean;
    }
  ): Promise<CalendarEvent> {
    const headers = await this.getAuthHeader();

    const body: any = {
      summary: params.summary,
      description: params.description,
      location: params.location,
      start: params.start,
      end: params.end,
      attendees: params.attendees,
    };

    if (params.addGoogleMeet) {
      body.conferenceData = {
        createRequest: {
          requestId: `dravis-meet-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      };
    }

    const url = `${CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create event: ${res.statusText}`);
    }

    const item = await res.json();
    return {
      id: item.id,
      summary: item.summary || "(No title)",
      description: item.description,
      location: item.location,
      start: item.start || {},
      end: item.end || {},
      attendees: item.attendees,
      htmlLink: item.htmlLink,
      hangoutLink: item.hangoutLink,
      status: item.status,
      colorId: item.colorId,
      created: item.created,
      updated: item.updated,
      isAllDay: Boolean(item.start?.date && !item.start?.dateTime),
    };
  }

  // 5. Quick Add Event using Natural Language Text (e.g. "Meeting with Alex tomorrow at 3pm")
  public async quickAddEvent(calendarId: string = "primary", text: string): Promise<CalendarEvent> {
    const headers = await this.getAuthHeader();
    const url = `${CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/quickAdd?text=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      method: "POST",
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to quick add event: ${res.statusText}`);
    }

    const item = await res.json();
    return {
      id: item.id,
      summary: item.summary || "(No title)",
      description: item.description,
      location: item.location,
      start: item.start || {},
      end: item.end || {},
      attendees: item.attendees,
      htmlLink: item.htmlLink,
      hangoutLink: item.hangoutLink,
      status: item.status,
      colorId: item.colorId,
      created: item.created,
      updated: item.updated,
      isAllDay: Boolean(item.start?.date && !item.start?.dateTime),
    };
  }

  // 6. Delete Event (Destructive - Requires Confirmation)
  public async deleteEvent(calendarId: string = "primary", eventId: string): Promise<void> {
    const headers = await this.getAuthHeader();
    const url = `${CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers,
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to delete calendar event: ${res.statusText}`);
    }
  }

  // 7. Update Event
  public async updateEvent(
    calendarId: string = "primary",
    eventId: string,
    updates: Partial<{
      summary: string;
      description: string;
      location: string;
      start: CalendarEventDateTime;
      end: CalendarEventDateTime;
    }>
  ): Promise<CalendarEvent> {
    const headers = await this.getAuthHeader();
    const url = `${CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to update event: ${res.statusText}`);
    }

    const item = await res.json();
    return {
      id: item.id,
      summary: item.summary || "(No title)",
      description: item.description,
      location: item.location,
      start: item.start || {},
      end: item.end || {},
      attendees: item.attendees,
      htmlLink: item.htmlLink,
      hangoutLink: item.hangoutLink,
      status: item.status,
      colorId: item.colorId,
      created: item.created,
      updated: item.updated,
      isAllDay: Boolean(item.start?.date && !item.start?.dateTime),
    };
  }
}

export const googleCalendarApi = new GoogleCalendarApiClient();
