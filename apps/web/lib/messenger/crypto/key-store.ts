import type { PublishMessengerKeysRequestDto } from '@soulsync/shared-types/messenger';
import { bytesToBase64Url, base64UrlToBytes, toArrayBuffer } from './bytes';

const DB_NAME = 'soulsync-messenger-keys';
const DB_VERSION = 1;
const IDENTITY_STORE = 'identity';
const SIGNED_PREKEY_STORE = 'signedPrekey';
const SESSION_STORE = 'sessions';

type StoredSession = {
  peerUserId: string;
  chainKey: string;
  sendCounter: number;
  recvCounter: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDENTITY_STORE)) {
        db.createObjectStore(IDENTITY_STORE);
      }
      if (!db.objectStoreNames.contains(SIGNED_PREKEY_STORE)) {
        db.createObjectStore(SIGNED_PREKEY_STORE);
      }
      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        db.createObjectStore(SESSION_STORE, { keyPath: 'peerUserId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

async function idbGet<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

async function idbPut(store: string, key: IDBValidKey, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
  });
}

export async function getIdentityKeyPair(): Promise<CryptoKeyPair | null> {
  return (await idbGet<CryptoKeyPair>(IDENTITY_STORE, 'pair')) ?? null;
}

export async function ensureIdentityKeyPair(): Promise<CryptoKeyPair> {
  const existing = await getIdentityKeyPair();
  if (existing) {
    return existing;
  }
  const pair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveBits'],
  );
  await idbPut(IDENTITY_STORE, 'pair', pair);
  return pair;
}

async function getSignedPreKeyPair(): Promise<CryptoKeyPair> {
  const existing = await idbGet<CryptoKeyPair>(SIGNED_PREKEY_STORE, 'pair');
  if (existing) {
    return existing;
  }
  const pair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  );
  await idbPut(SIGNED_PREKEY_STORE, 'pair', pair);
  return pair;
}

async function exportPublicSpki(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('spki', key);
  return bytesToBase64Url(raw);
}

async function importPublicSpki(spki: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'spki',
    toArrayBuffer(base64UrlToBytes(spki)),
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    [],
  );
}

export async function buildPublishKeysPayload(): Promise<PublishMessengerKeysRequestDto> {
  const identity = await ensureIdentityKeyPair();
  const signed = await getSignedPreKeyPair();
  const identityPublicKey = await exportPublicSpki(identity.publicKey);
  const signedPreKeyPublic = await exportPublicSpki(signed.publicKey);
  const signedPreKeySignature = bytesToBase64Url(
    await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(`${identityPublicKey}.${signedPreKeyPublic}`),
    ),
  );
  const oneTimePrekeys: PublishMessengerKeysRequestDto['oneTimePrekeys'] = [];
  for (let i = 0; i < 5; i += 1) {
    const otp = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits'],
    );
    oneTimePrekeys.push({
      keyId: i + 1,
      publicKey: await exportPublicSpki(otp.publicKey),
    });
  }
  return {
    identityPublicKey,
    signedPreKeyPublic,
    signedPreKeySignature,
    signedPreKeyId: 1,
    oneTimePrekeys,
  };
}

export async function getLocalIdentityPublicKey(): Promise<string> {
  const identity = await ensureIdentityKeyPair();
  return exportPublicSpki(identity.publicKey);
}

export async function getSession(peerUserId: string): Promise<StoredSession | null> {
  return (await idbGet<StoredSession>(SESSION_STORE, peerUserId)) ?? null;
}

export async function saveSession(session: StoredSession): Promise<void> {
  await idbPut(SESSION_STORE, session.peerUserId, session);
}

export async function establishSession(
  peerUserId: string,
  peerIdentityPublicKey: string,
  peerSignedPreKeyPublic: string,
): Promise<StoredSession> {
  const identity = await ensureIdentityKeyPair();
  const peerSigned = await importPublicSpki(peerSignedPreKeyPublic);
  const shared = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerSigned },
    identity.privateKey,
    256,
  );
  const peerIdentity = await importPublicSpki(peerIdentityPublicKey);
  const shared2 = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerIdentity },
    identity.privateKey,
    256,
  );
  const material = new Uint8Array(64);
  material.set(new Uint8Array(shared), 0);
  material.set(new Uint8Array(shared2), 32);
  const chainKey = bytesToBase64Url(
    await crypto.subtle.digest('SHA-256', material),
  );
  const session: StoredSession = { peerUserId, chainKey, sendCounter: 0, recvCounter: 0 };
  await saveSession(session);
  return session;
}

async function deriveAesKey(chainKeyB64: string, counter: number): Promise<CryptoKey> {
  const base = base64UrlToBytes(chainKeyB64);
  const info = new TextEncoder().encode(`msg:${counter}`);
  const keyMaterial = await crypto.subtle.importKey('raw', toArrayBuffer(base), 'HKDF', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function advanceChainKey(chainKeyB64: string): Promise<string> {
  const base = base64UrlToBytes(chainKeyB64);
  const next = await crypto.subtle.digest('SHA-256', toArrayBuffer(base));
  return bytesToBase64Url(next);
}

export async function encryptForPeer(
  peerUserId: string,
  peerIdentityPublicKey: string,
  peerSignedPreKeyPublic: string,
  plaintext: string,
): Promise<{ ciphertext: string; nonce: string; header: Record<string, unknown> }> {
  let session = await getSession(peerUserId);
  if (!session) {
    session = await establishSession(peerUserId, peerIdentityPublicKey, peerSignedPreKeyPublic);
  }
  const counter = session.sendCounter;
  const aesKey = await deriveAesKey(session.chainKey, counter);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded);
  session.sendCounter += 1;
  session.chainKey = await advanceChainKey(session.chainKey);
  await saveSession(session);
  return {
    ciphertext: bytesToBase64Url(cipher),
    nonce: bytesToBase64Url(iv),
    header: { v: 1, counter },
  };
}

export async function decryptFromPeer(
  peerUserId: string,
  peerIdentityPublicKey: string,
  peerSignedPreKeyPublic: string,
  ciphertext: string,
  nonce: string,
  header: Record<string, unknown>,
): Promise<string> {
  let session = await getSession(peerUserId);
  if (!session) {
    session = await establishSession(peerUserId, peerIdentityPublicKey, peerSignedPreKeyPublic);
  }
  const counter = typeof header.counter === 'number' ? header.counter : session.recvCounter;
  const aesKey = await deriveAesKey(session.chainKey, counter);
  const ivBytes = base64UrlToBytes(nonce);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(toArrayBuffer(ivBytes)) },
    aesKey,
    toArrayBuffer(base64UrlToBytes(ciphertext)),
  );
  session.recvCounter = counter + 1;
  session.chainKey = await advanceChainKey(session.chainKey);
  await saveSession(session);
  return new TextDecoder().decode(plain);
}
