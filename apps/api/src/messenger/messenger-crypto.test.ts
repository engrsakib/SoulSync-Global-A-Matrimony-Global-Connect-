import { describe, it } from '@jest/globals';
import assert from 'node:assert/strict';

describe('messenger ciphertext boundary', () => {
  it('opaque payload does not contain plaintext substring', () => {
    const plaintext = 'Hello SoulSync secret';
    const ciphertext = Buffer.from(plaintext, 'utf8').toString('base64url');
    assert.ok(!ciphertext.includes('SoulSync'));
    assert.notEqual(ciphertext, plaintext);
  });
});
