import { BIODATA_ENC_PREFIX, decryptWithKey, encryptWithKey } from '../src/crypto/field-crypto';

const key = Buffer.alloc(32, 9);

describe('field-crypto', () => {
  it('round-trips with enc prefix', () => {
    const enc = encryptWithKey('Dhaka', key);
    expect(enc.startsWith(BIODATA_ENC_PREFIX)).toBe(true);
    expect(decryptWithKey(enc, key)).toBe('Dhaka');
  });

  it('returns legacy plaintext unchanged', () => {
    expect(decryptWithKey('Unknown', key)).toBe('Unknown');
  });

  it('detects tampered ciphertext', () => {
    const enc = encryptWithKey('secret', key);
    const tampered = `${enc.slice(0, -2)}xx`;
    expect(decryptWithKey(tampered, key)).toBeNull();
  });
});
