import axios from 'axios';
import { log } from '../../shared/logger.js';
import { pipedreamAuthService } from './pipedream-auth.service.js';

interface PipedreamApp {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;   // mapped from icon_url
}

// In-memory cache for apps fetched directly from Pipedream
let appsCache: PipedreamApp[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export const pipedreamAppsService = {
  /**
   * Fetch all apps from Pipedream and cache them in memory.
   * Uses Pipedream's cursor-based pagination (page_info.end_cursor / after param).
   */
  async ensureCache() {
    const now = Date.now();
    if (appsCache.length > 0 && now - lastFetchTime < CACHE_DURATION) {
      return;
    }

    log.info('[pipedream-apps] Refreshing live apps cache from Pipedream...');
    try {
      const accessToken = await pipedreamAuthService.getOAuthToken();
      let allApps: PipedreamApp[] = [];
      const limit = 100;
      let cursor: string | null = null; // Pipedream uses cursor-based pagination

      while (true) {
        const params: Record<string, any> = { limit };
        if (cursor) params.after = cursor; // pass cursor for next page

        const res = await axios.get('https://api.pipedream.com/v1/apps', {
          params,
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        const data: any[] = res.data?.data || [];
        if (data.length === 0) break;

        allApps = [...allApps, ...data.map((app: any) => ({
          id: app.id,
          name: app.name,
          slug: app.name_slug || app.slug || '',   // SDK uses name_slug
          description: app.description,
          // Canonical Pipedream CDN logo URL — always works with the app ID
          icon: `https://assets.pipedream.net/s.v0/${app.id}/logo/orig`,
        }))];

        log.info(`[pipedream-apps] Fetched ${allApps.length} apps so far...`);

        // Pipedream returns page_info with end_cursor; no cursor = last page
        const pageInfo = res.data?.page_info;
        if (!pageInfo?.end_cursor || data.length < limit) break;
        cursor = pageInfo.end_cursor;

        // Safety break
        if (allApps.length > 5000) break;
      }

      // Deduplicate by ID (safety net)
      const seen = new Map<string, PipedreamApp>();
      for (const app of allApps) {
        if (!seen.has(app.id)) seen.set(app.id, app);
      }
      appsCache = Array.from(seen.values());
      lastFetchTime = now;
      log.info(`[pipedream-apps] Cached ${appsCache.length} unique apps from Pipedream.`);
    } catch (err: any) {
      log.error('[pipedream-apps] Failed to refresh apps cache:', err.message);
    }
  },

  /**
   * Search apps in-memory. Replacement for DB 'ILIKE' query.
   */
  async searchApps(query: string = '', limit: number = 100, offset: number = 0) {
    await this.ensureCache();
    
    const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    
    const filtered = searchTerms.length === 0 
      ? appsCache 
      : appsCache.filter(app => {
          const content = `${app.name} ${app.description || ''} ${app.slug}`.toLowerCase();
          return searchTerms.every(term => content.includes(term));
        });

    const total = filtered.length;
    const results = filtered.slice(offset, offset + limit);
    return { results, total };
  },

  async getAppCount() {
    await this.ensureCache();
    return appsCache.length;
  },

  /**
   * Resolve a slug from the memory cache by ID
   */
  async getSlugById(id: string): Promise<string | null> {
    await this.ensureCache();
    const app = appsCache.find(a => a.id === id);
    return app?.slug || null;
  }
};
