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
   * Simple keyword/text search for RAG grounding.
   * In production, this would use pgvector.
   */
  async searchKnowledge(userId: string, query: string, knowledgeIds?: string[]) {
    // If specific IDs are provided (assigned to employee), restrict search.
    const baseQuery = db.select().from(knowledge).where(eq(knowledge.userId, userId));
    const items = await baseQuery;
    
    // Filter by assigned IDs if provided
    const scope = knowledgeIds?.length ? items.filter(k => knowledgeIds.includes(k.id)) : items;

    // Basic rank-by-keyword-match
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    const ranked = scope.map(k => {
      let score = 0;
      const content = (k.title + " " + k.content).toLowerCase();
      keywords.forEach(word => {
        if (content.includes(word)) score++;
      });
      return { ...k, score };
    }).filter(k => k.score > 0).sort((a,b) => b.score - a.score);

    return ranked.slice(0, 3); // Return top 3 matches
  }
};
