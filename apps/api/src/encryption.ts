/**
 * AES-256-GCM encryption/decryption for credential secrets.
 * Used by both the API (to encrypt) and the Worker (to decrypt).
 *
 * Requires: ENCRYPTION_KEY env var = 64 hex chars (32 bytes)
 * Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY ?? '';
  if (!hex || hex.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY env var must be a 64-char hex string (32 bytes). ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(hex, 'hex');
}

/** Encrypts a plain object → returns "iv:authTag:ciphertext" (all base64) */
export function encryptCredential(data: Record<string, any>): string {
  const key    = getKey();
  const iv     = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const plaintext  = JSON.stringify(data);
  const encrypted  = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag    = cipher.getAuthTag();

  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':');
}

/** Decrypts the stored string → returns the original object */
export function decryptCredential(stored: string): Record<string, any> {
  const key    = getKey();
  const parts  = stored.split(':');
  if (parts.length !== 3) throw new Error('Invalid credential format (expected iv:authTag:ciphertext)');

  const iv         = Buffer.from(parts[0]!, 'base64');
  const authTag    = Buffer.from(parts[1]!, 'base64');
  const ciphertext = Buffer.from(parts[2]!, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}
