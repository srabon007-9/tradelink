'use strict';

/**
 * services/googleCalendar.service.js — Google Calendar Integration
 *
 * Creates and shares a calendar event for an accepted trade session.
 * Uses a single OAuth2-authorized app calendar (client id/secret + a
 * long-lived refresh token — see config/env.js), not per-user Google
 * login. Both participants are added as event attendees by email, so
 * Google sends each of them a calendar invite directly.
 *
 * Gracefully no-ops when Google credentials aren't configured, so
 * accepting a trade proposal never fails just because Calendar sync
 * hasn't been set up yet (see tradeProposal.service.js's acceptProposal).
 */

const { google } = require('googleapis');
const { config } = require('../config/env');
const logger = require('../utils/logger');

const isConfigured = () =>
  Boolean(config.google.clientId && config.google.clientSecret && config.google.refreshToken);

const getCalendarClient = () => {
  const oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
  oauth2Client.setCredentials({ refresh_token: config.google.refreshToken });
  return google.calendar({ version: 'v3', auth: oauth2Client });
};

/**
 * Creates a calendar event and invites both participants by email.
 *
 * @param {{
 *   summary: string,
 *   description: string,
 *   startTime: Date,
 *   durationMinutes: number,
 *   attendeeEmails: string[]
 * }} opts
 * @returns {Promise<{ synced: boolean, eventId?: string, eventLink?: string, error?: string }>}
 */
const createSessionEvent = async ({ summary, description, startTime, durationMinutes, attendeeEmails }) => {
  if (!isConfigured()) {
    const message =
      'Google Calendar is not configured (missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / ' +
      'GOOGLE_REFRESH_TOKEN) — the trade was accepted but no calendar invite was sent.';
    logger.warn(`[GoogleCalendar] ${message}`);
    return { synced: false, error: message };
  }

  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  try {
    const calendar = getCalendarClient();
    const { data } = await calendar.events.insert({
      calendarId: config.google.calendarId,
      sendUpdates: 'all',
      requestBody: {
        summary,
        description,
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
        attendees: attendeeEmails.map(email => ({ email })),
      },
    });

    logger.info(`[GoogleCalendar] Session event created: ${data.id}`);
    return { synced: true, eventId: data.id, eventLink: data.htmlLink };
  } catch (err) {
    logger.error(`[GoogleCalendar] Failed to create session event: ${err.message}`);
    return { synced: false, error: err.message };
  }
};

module.exports = { createSessionEvent, isConfigured };
