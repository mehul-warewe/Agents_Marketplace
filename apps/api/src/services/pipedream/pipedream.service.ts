import axios from 'axios';
import { log } from '../../shared/logger.js';
import { pipedreamAppsService } from './pipedream-apps.service.js';
import { pipedreamAuthService } from './pipedream-auth.service.js';

export const pipedreamService = {
  /** Get a short-lived OAuth access token from Pipedream using client credentials */
  async getOAuthToken(): Promise<string> {
    return pipedreamAuthService.getOAuthToken();
  },

  /**
   * Resolve a Pipedream app ID or slug to a canonical slug.
   * Now uses the LIVE apps cache instead of the database.
   */
  async resolveAppSlug(appSlug: string): Promise<string> {
    if (!appSlug) return '';

    // 1. Hardcoded Priority Overrides
    const OVERRIDES: Record<string, string> = {
      'app_168hvn': 'google_sheets',
      'app_OkrhR1': 'slack',
      'app_m5ghAd': 'openai',
      'app_XBxh4x': 'openai',
      'app_MLhByY': 'github',
      'app_Vkh78V': 'discord',
      'app_13GhxE': 'zoom_admin',
      'app_167h6y': 'anthropic',
      'app_m7ghE4': 'google_drive',
      'app_XKvhQ3': 'youtube',
      'app_mArhnB': 'youtube',
      'youtube_data': 'youtube',
      'youtube_analytics': 'youtube'
    };
    if (OVERRIDES[appSlug]) return OVERRIDES[appSlug];

    // Already a human-readable slug (not an app_ ID)
    if (!appSlug.startsWith('app_')) return appSlug;

    // 2. Lookup in our LIVE in-memory cache (no DB)
    const cachedSlug = await pipedreamAppsService.getSlugById(appSlug);
    if (cachedSlug && !cachedSlug.startsWith('app_')) {
      return cachedSlug;
    }

    // 3. Last Resort: Live API lookup for 100% accuracy
    try {
      log.info(`[pipedream] resolveAppSlug: Requesting live slug from Pipedream for ID "${appSlug}"`);
      const accessToken = await this.getOAuthToken();
      const res = await axios.get(`https://api.pipedream.com/v1/apps/${appSlug}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      const realSlug = res.data?.data?.slug;
      if (realSlug && !realSlug.startsWith('app_')) {
        log.info(`[pipedream] resolveAppSlug: Live API resolved "${appSlug}" → "${realSlug}"`);
        return realSlug;
      }
    } catch (apiErr: any) {
      log.warn(`[pipedream] resolveAppSlug: Live API lookup failed for "${appSlug}":`, apiErr.message);
    }

    return appSlug;
  },

  /**
   * Generate a Pipedream Connect token for a specific user + app.
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

    if (connectLinkUrl) {
      const base = connectLinkUrl.split('&app=')[0].split('?app=')[0].split('&connectLink=')[0];
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
   */
  async getConnectedAccounts(externalUserId: string, resolvedAppSlug?: string) {
    const accessToken = await this.getOAuthToken();
    const projectId = process.env.PIPEDREAM_PROJECT_ID;
    const environment = process.env.PIPEDREAM_ENVIRONMENT || 'development';

    const url = `https://api.pipedream.com/v1/connect/${projectId}/accounts?external_user_id=${externalUserId}`;
    
    const res = await axios.get(url, {
      headers: { 
        Authorization: `Bearer ${accessToken}`, 
        'x-pd-environment': environment 
      },
    });

    const accounts = res.data?.data ?? [];
    
    // Map Pipedream's 'name_slug' to 'slug' for downstream consistency
    return accounts.map((acc: any) => ({
      ...acc,
      app: acc.app ? {
        ...acc.app,
        slug: acc.app.name_slug || acc.app.slug || '',
      } : null
    }));
  },

  /**
   * Delete a connected account from Pipedream.
   */
  async deleteAccount(externalUserId: string, accountId: string) {
    const accessToken = await this.getOAuthToken();
    const projectId = process.env.PIPEDREAM_PROJECT_ID;
    const environment = process.env.PIPEDREAM_ENVIRONMENT || 'development';

    const url = `https://api.pipedream.com/v1/connect/${projectId}/accounts/${accountId}?external_user_id=${externalUserId}`;
    
    await axios.delete(url, {
      headers: { 
        Authorization: `Bearer ${accessToken}`, 
        'x-pd-environment': environment 
      },
    });

    log.info(`[pipedream] account ${accountId} deleted for user=${externalUserId}`);
    return { success: true };
  },
};
