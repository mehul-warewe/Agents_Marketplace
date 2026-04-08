import { pipedreamApps, desc, ilike, or } from '@repo/database';
import { db } from '../../shared/db.js';

export const pipedreamAppsService = {
  async searchApps(query: string = '', limit: number = 100, offset: number = 0) {
    let whereClause = undefined;
    if (query) {
      whereClause = or(
        ilike(pipedreamApps.name, `%${query}%`),
        ilike(pipedreamApps.slug, `%${query}%`)
      );
    }

    return await db.select()
      .from(pipedreamApps)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(pipedreamApps.lastSyncedAt));
  }
};
