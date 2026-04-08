import { credentials, eq, and, desc } from '@repo/database';
import { db } from '../../shared/db.js';
import { encryptCredential, decryptCredential } from '../../shared/encryption.js';
import { testConnectivity } from './connectivity.service.js';
import { getSchema } from './schema.service.js';

export const credentialsService = {
  async listCredentials(userId: string) {
    return await db.select()
      .from(credentials)
      .where(eq(credentials.userId, userId))
      .orderBy(desc(credentials.createdAt));
  },

  async createCredential(userId: string, name: string, type: string, data: any) {
    const schema = getSchema(type);
    if (!schema) throw new Error(`Unsupported credential type: ${type}`);

    // Test connectivity before saving
    const { ok, message } = await testConnectivity(type, data);
    if (!ok) throw new Error(`Connectivity test failed: ${message}`);

    const encryptedData = encryptCredential(data);

    const [newCred] = await db.insert(credentials).values({
      userId,
      name,
      type,
      data: encryptedData,
      isValid: true,
    }).returning();

    return newCred;
  },

  async updateCredential(credId: string, userId: string, updates: any) {
    // Only name update supported without re-checking or re-encrypting for now
    // If data updates are needed, we'd need to re-verify connectivity
    const [updated] = await db.update(credentials)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(credentials.id, credId), eq(credentials.userId, userId)))
      .returning();
    
    if (!updated) throw new Error('Credential not found or access denied');
    return updated;
  },

  async deleteCredential(credId: string, userId: string) {
    const [deleted] = await db.delete(credentials)
      .where(and(eq(credentials.id, credId), eq(credentials.userId, userId)))
      .returning();
    
    if (!deleted) throw new Error('Credential not found or access denied');
    return deleted;
  },

  async testCredential(credId: string, userId: string) {
    const rows = await db.select()
      .from(credentials)
      .where(and(eq(credentials.id, credId), eq(credentials.userId, userId)));
    
    const cred = rows[0];
    if (!cred) throw new Error('Credential not found');

    const decryptedData = decryptCredential(cred.data);
    const { ok, message } = await testConnectivity(cred.type, decryptedData);

    await db.update(credentials)
      .set({ isValid: ok, updatedAt: new Date() })
      .where(eq(credentials.id, credId));

    return { ok, message };
  }
};
