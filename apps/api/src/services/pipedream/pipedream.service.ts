import axios from 'axios';
import { log } from '../../shared/logger.js';
import { pipedreamApps, eq } from '@repo/database';
import { db } from '../../shared/db.js';

export const pipedreamService = {
  /** Get a short-lived OAuth access token from Pipedream using client credentials */
  async getOAuthToken(): Promise<string> {
    const { PIPEDREAM_CLIENT_ID, PIPEDREAM_CLIENT_SECRET } = process.env;
    const auth = Buffer.from(`${PIPEDREAM_CLIENT_ID}:${PIPEDREAM_CLIENT_SECRET}`).toString('base64');
    const res = await axios.post(
      'https://api.pipedream.com/v1/oauth/token',
      new URLSearchParams({ grant_type: 'client_credentials' }),
      { headers: { Authorization: `Basic ${auth}` } }
    );
    return res.data.access_token;
  },

  /**
   * Resolve a Pipedream app ID (e.g. "app_m5ghAd") or slug (e.g. "openai")
   * to a canonical slug that Pipedream Connect accepts.
   *
   * Resolution order:
   *  1. Already a slug (no "app_" prefix) → return as-is
   *  2. Database lookup — use stored slug, or derive from app name
   *  3. Hardcoded fail-safe for the most common apps
   *  4. Return raw value with warning
   */
  async resolveAppSlug(appSlug: string): Promise<string> {
    if (!appSlug) return '';

    // Already a human-readable slug
    if (!appSlug.startsWith('app_')) return appSlug;

    // 1. Database lookup
    try {
      const rows = await db.select({
        name: pipedreamApps.name,
        slug: pipedreamApps.slug,
      }).from(pipedreamApps).where(eq(pipedreamApps.id, appSlug)).limit(1);

      const row = rows[0];
      if (row) {
        // Proper slug stored
        if (row.slug && !row.slug.startsWith('app_')) return row.slug;

        // DB has corrupted slug (still the raw ID) — derive from app name
        // "Google Sheets" → "google_sheets", "Slack" → "slack"
        if (row.name) {
          return row.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        }
      }
    } catch (err) {
      log.error(`[pipedream] resolveAppSlug: DB error for "${appSlug}":`, err);
    }

    // 2. Hardcoded fail-safe for widely-used apps
    const FALLBACKS: Record<string, string> = {
      'app_168hvn': 'google_sheets',
      'app_OkrhR1': 'slack',
      'app_m5ghAd': 'openai',
      'app_XBxh4x': 'openai',
      'app_MLhByY': 'github',
      'app_Vkh78V': 'discord',
      'app_13GhxE': 'zoom_admin',
      'app_167h6y': 'anthropic',
      'app_m7ghE4': 'google_drive',
    };
    if (FALLBACKS[appSlug]) return FALLBACKS[appSlug];

    log.warn(`[pipedream] resolveAppSlug: could not resolve "${appSlug}" — using raw value`);
    return appSlug;
  },

  /**
   * Generate a Pipedream Connect token for a specific user + app.
   * Accepts a pre-resolved slug — call resolveAppSlug before this.
   */
  async generateConnectToken(externalUserId: string, resolvedAppSlug: string) {
    const accessToken = await this.getOAuthToken();
    const projectId = process.env.PIPEDREAM_PROJECT_ID;
    const environment = process.env.PIPEDREAM_ENVIRONMENT || 'development';

    const res = await axios.post(
      `https://api.pipedream.com/v1/connect/${projectId}/tokens`,
      { external_user_id: externalUserId, app_slug: resolvedAppSlug },
      { headers: { Authorization: `Bearer ${accessToken}`, 'x-pd-environment': environment } }
    );

    const token = (res.data.token || '').trim();
    let connectLinkUrl = (res.data.connect_link_url || '').trim();

    // Build a clean URL with the correct app param (strip any Pipedream-returned app= param)
    if (connectLinkUrl) {
      const base = connectLinkUrl.split('&app=')[0].split('?app=')[0];
      const sep = base.includes('?') ? '&' : '?';
      connectLinkUrl = `${base}${sep}app=${resolvedAppSlug}&connectLink=true`;
    } else {
      connectLinkUrl = `https://pipedream.com/_static/connect.html?token=${token}&app=${resolvedAppSlug}&connectLink=true`;
    }

    log.info(`[pipedream] connect token generated for user=${externalUserId} app=${resolvedAppSlug}`);

    return { token, resolvedAppSlug, connectLinkUrl };
  },

  /**
   * Fetch connected accounts for a user from Pipedream.
   * Returns the accounts array directly.
   */
  async getConnectedAccounts(externalUserId: string, resolvedAppSlug?: string) {
    const accessToken = await this.getOAuthToken();
    const projectId = process.env.PIPEDREAM_PROJECT_ID;
    const environment = process.env.PIPEDREAM_ENVIRONMENT || 'development';

    let url = `https://api.pipedream.com/v1/connect/${projectId}/accounts?external_user_id=${externalUserId}`;
    if (resolvedAppSlug) url += `&app_slug=${resolvedAppSlug}`;

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}`, 'x-pd-environment': environment },
    });

    // Pipedream returns { data: [...accounts] }
    return res.data?.data ?? [];
  },
};
