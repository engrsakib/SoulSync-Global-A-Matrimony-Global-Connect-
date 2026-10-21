import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export const BIODATA_ENC_PREFIX = 'enc:v1:';

export function isEncryptedValue(value: string): boolean {
  return value.startsWith(BIODATA_ENC_PREFIX);
}

export function encryptWithKey(plain: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
  return `${BIODATA_ENC_PREFIX}${payload}`;
}

export function decryptWithKey(stored: string, key: Buffer): string | null {
  if (!isEncryptedValue(stored)) {
    return stored;
  }
  const payload = stored.slice(BIODATA_ENC_PREFIX.length);
  const parts = payload.split('.');
  if (parts.length !== 3) {
    return null;
  }
  try {
    const iv = Buffer.from(parts[0]!, 'base64url');
    const tag = Buffer.from(parts[1]!, 'base64url');
    const data = Buffer.from(parts[2]!, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
