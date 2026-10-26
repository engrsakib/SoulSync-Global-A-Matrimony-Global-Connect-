import assert from 'node:assert/strict';
import test from 'node:test';
import { bytesToBase64Url } from './bytes';
import { deriveSharedRootKeyV2AsParty } from './key-store';

async function exportPublicSpki(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('spki', key);
  return bytesToBase64Url(raw);
}

void test('messenger v2 shared root key matches on both parties', async () => {
  const alice = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  );
  const bob = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  );

  const alicePub = await exportPublicSpki(alice.publicKey);
  const bobPub = await exportPublicSpki(bob.publicKey);

  const fromAlice = await deriveSharedRootKeyV2AsParty(alice.privateKey, bobPub);
  const fromBob = await deriveSharedRootKeyV2AsParty(bob.privateKey, alicePub);

  assert.equal(fromAlice, fromBob);
});
