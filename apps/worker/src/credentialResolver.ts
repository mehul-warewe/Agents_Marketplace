import * as dotenv from 'dotenv';
import { createClient, credentials, eq, and, inArray, desc } from '@repo/database';
import { decryptCredential } from './credentialEncryption.js';
import axios from 'axios';

dotenv.config({ path: '../../.env' });

const db = createClient(process.env.POSTGRES_URL!);

export interface ResolvedCredential {
  id: string;
  type: string;
  data: Record<string, any>;
}

/**
 * Fetches and decrypts a credential by ID, verifying it belongs to the given userId.
 */
export async function resolveCredential(
  credentialId: string,
  userId: string,
): Promise<ResolvedCredential> {
  const rows = await db.select()
    .from(credentials)
    .where(and(
      eq(credentials.id, credentialId),
      eq(credentials.userId, userId),
    ));

  const cred = rows[0];
  if (!cred) throw new Error(`Credential ${credentialId} not found or access denied`);
  if (!cred.isValid) throw new Error(`Credential "${cred.name}" is marked invalid. Please re-connect it in Settings → Integrations.`);

  const data = decryptCredential(cred.data);
  const normalized: Record<string, any> = { ...data };
  if (data.access_token) normalized.accessToken = data.access_token;
  if (data.refresh_token) normalized.refreshToken = data.refresh_token;
  if (data.refresh_token) normalized.refresh_token = data.refresh_token; // ensure both cases
  if (data.expires_at) normalized.expiresAt = data.expires_at;
  if (data.service_role_key) normalized.serviceRoleKey = data.service_role_key;
  if (data.supabase_url) normalized.supabaseUrl = data.supabase_url;
  
  return { id: cred.id, type: cred.type, data: normalized };
}

/**
 * Automatically finds the newest valid credential for a given set of types.
 */
export async function resolveDefaultCredential(
  types: string[],
  userId: string,
): Promise<ResolvedCredential | null> {
  const rows = await db.select()
    .from(credentials)
    .where(and(
      inArray(credentials.type, types),
      eq(credentials.userId, userId),
      eq(credentials.isValid, true),
    ))
    .orderBy(desc(credentials.createdAt));

  const cred = rows[0];
  if (!cred) return null;

  const data = decryptCredential(cred.data);
  const normalized: Record<string, any> = { ...data };
  if (data.access_token) normalized.accessToken = data.access_token;
  if (data.refresh_token) normalized.refreshToken = data.refresh_token;
  if (data.expires_at) normalized.expiresAt = data.expires_at;
  if (data.service_role_key) normalized.serviceRoleKey = data.service_role_key;
  if (data.supabase_url) normalized.supabaseUrl = data.supabase_url;

  return { id: cred.id, type: cred.type, data: normalized };
}

/**
 * Resolves a Google OAuth credential, auto-refreshing the access token if expired.
 */
export async function resolveGoogleToken(credentialId: string, userId: string): Promise<string> {
  console.log(`[resolveGoogleToken] Request for ID: ${credentialId}, User: ${userId}`);
  const rows = await db.select()
    .from(credentials)
    .where(and(
      eq(credentials.id, credentialId), 
      eq(credentials.userId, userId)
    ));

  const cred = rows[0];
  if (!cred) {
      console.error(`[resolveGoogleToken] Credential not found for ID: ${credentialId}`);
      throw new Error(`Google credential ${credentialId} not found`);
  }

  const data = decryptCredential(cred.data);
  console.log(`[resolveGoogleToken] Successfully decrypted. Scopes: ${data.scopes || 'N/A'}`);

  const now      = Date.now();
  const expiresAt = new Date(data.expires_at as string).getTime();

  // Still valid
  if (now < expiresAt - 60_000) return data.access_token as string;

  console.log('[resolveCredential] Google token expired — refreshing…');

  const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
    refresh_token: data.refresh_token,
    client_id:     process.env.GOOGLE_INTEGRATION_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_INTEGRATION_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    grant_type:    'refresh_token',
  });

  const { access_token, expires_in } = tokenRes.data;
  const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

  // We re-encrypt and save the refreshed data
  const { createCipheriv, randomBytes } = await import('crypto');
  const updatedData = { ...data, access_token, expires_at: newExpiresAt };

  // Use the worker's simple re-encryption (same algorithm)
  function simpleEncrypt(obj: Record<string, any>): string {
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    const iv  = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':');
  }

  await db.update(credentials)
    .set({ data: simpleEncrypt(updatedData), updatedAt: new Date() })
    .where(eq(credentials.id, credentialId));

  return access_token as string;
}
