/**
 * AES-256-GCM decryption — worker-side copy.
 * The worker only ever DECRYPTS (it never encrypts credentials).
 */
import { createDecipheriv } from 'crypto';

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY ?? '';
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY env var must be a 64-char hex string (32 bytes).');
  }
  return Buffer.from(hex, 'hex');
}

export function decryptCredential(stored: string): Record<string, any> {
  const key   = getKey();
  const parts = stored.split(':');
  if (parts.length !== 3) throw new Error('Invalid credential format');

  const iv         = Buffer.from(parts[0]!, 'base64');
  const authTag    = Buffer.from(parts[1]!, 'base64');
  const ciphertext = Buffer.from(parts[2]!, 'base64');

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}
