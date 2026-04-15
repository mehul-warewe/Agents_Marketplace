import { knowledge, eq, and, sql } from '@repo/database';
import { db } from '../../shared/db.js';

export const knowledgeService = {
  async listKnowledge(userId: string) {
    return await db.select().from(knowledge).where(eq(knowledge.userId, userId));
  },

  async createKnowledge(userId: string, data: any) {
    const [item] = await db.insert(knowledge).values({
      userId,
      title: data.title,
      content: data.content,
      metadata: data.metadata || {}
    }).returning();
    return item;
  },

  async getKnowledge(id: string) {
    const [item] = await db.select().from(knowledge).where(eq(knowledge.id, id));
    return item;
  },

  /**
   * Improved keyword/text search for RAG grounding with TF-IDF style scoring.
   * In production, this would use pgvector for semantic search.
   */
  async searchKnowledge(userId: string, query: string, knowledgeIds?: string[]) {
    // If specific IDs are provided (assigned to employee), restrict search.
    const baseQuery = db.select().from(knowledge).where(eq(knowledge.userId, userId));
    const items = await baseQuery;

    // Filter by assigned IDs if provided
    const scope = knowledgeIds?.length ? items.filter(k => knowledgeIds.includes(k.id)) : items;

    // TF-IDF style ranking: title matches 3x, content matches 1x, whole-word matches bonus
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    const ranked = scope.map(k => {
      let score = 0;
      const titleText = (k.title || '').toLowerCase();
      const contentText = (k.content || '').toLowerCase();

      keywords.forEach(word => {
        // Title matches weighted 3x
        if (titleText.includes(word)) score += 3;

        // Whole-word match in title (bonus)
        if (titleText.match(new RegExp(`\\b${word}\\b`))) score += 2;

        // Content matches weighted 1x
        if (contentText.includes(word)) score += 1;

        // Whole-word match in content (bonus)
        if (contentText.match(new RegExp(`\\b${word}\\b`))) score += 0.5;
      });

      return { ...k, score };
    }).filter(k => k.score > 0).sort((a,b) => b.score - a.score);

    return ranked.slice(0, 5); // Return top 5 matches
  },

  async updateKnowledge(id: string, userId: string, data: any) {
    const existing = await this.getKnowledge(id);
    if (!existing || existing.userId !== userId) {
      throw new Error('Unauthorized or not found');
    }

    const [updated] = await db.update(knowledge).set({
      title: data.title !== undefined ? data.title : existing.title,
      content: data.content !== undefined ? data.content : existing.content,
      metadata: data.metadata !== undefined ? data.metadata : existing.metadata
    }).where(eq(knowledge.id, id)).returning();

    return updated;
  },

  async deleteKnowledge(id: string, userId: string) {
    const existing = await this.getKnowledge(id);
    if (!existing || existing.userId !== userId) {
      throw new Error('Unauthorized or not found');
    }

    await db.delete(knowledge).where(eq(knowledge.id, id));
    return { id };
  }
};
