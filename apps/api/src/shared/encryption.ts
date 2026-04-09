import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error(
    'ENCRYPTION_KEY is missing from environment variables. ' +
    'Please add a 64-character hex string to your .env file. ' +
    'You can generate one using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

if (ENCRYPTION_KEY.length !== 64) {
  throw new Error(`ENCRYPTION_KEY must be exactly 64 characters (current length: ${ENCRYPTION_KEY.length})`);
}

const key = Buffer.from(ENCRYPTION_KEY, 'hex');

/**
 * Encrypts a string into IV:TAG:CONTENT format
 */
export function encryptCredential(data: Record<string, any>): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const tag = cipher.getAuthTag();
  
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypts an IV:TAG:CONTENT string
 */
export function decryptCredential(encryptedData: string): Record<string, any> {
  try {
    const [ivStr, tagStr, content] = encryptedData.split(':');
    if (!ivStr || !tagStr || !content) throw new Error('Invalid format');

    const iv = Buffer.from(ivStr, 'base64');
    const tag = Buffer.from(tagStr, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(content, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (err: any) {
    throw new Error(`Decryption failed: ${err.message}`);
  }
}
