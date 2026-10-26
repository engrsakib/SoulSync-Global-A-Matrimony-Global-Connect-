import { createHash } from 'crypto';

/** 60-digit safety number from SHA-256 of sorted identity public keys. */
export function formatMessengerSafetyNumber(
  identityKeyA: string,
  identityKeyB: string,
  userIdA: string,
  userIdB: string,
): string {
  const [firstKey, secondKey] =
    userIdA.localeCompare(userIdB) <= 0
      ? [identityKeyA, identityKeyB]
      : [identityKeyB, identityKeyA];
  const digest = createHash('sha256').update(`${firstKey}:${secondKey}`, 'utf8').digest();
  const digits: string[] = [];
  for (let i = 0; i < digest.length && digits.length < 60; i += 1) {
    digits.push(String(digest[i]! % 10));
  }
  while (digits.length < 60) {
    const extra = createHash('sha256').update(digest).update(String(digits.length)).digest();
    for (let i = 0; i < extra.length && digits.length < 60; i += 1) {
      digits.push(String(extra[i]! % 10));
    }
  }
  const joined = digits.slice(0, 60).join('');
  return joined.replace(/(\d{5})/g, '$1 ').trim();
}

export function identityKeyFingerprint(identityPublicKey: string): string {
  return createHash('sha256').update(identityPublicKey, 'utf8').digest('hex');
}
