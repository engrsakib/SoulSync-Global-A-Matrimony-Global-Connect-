import type { PublishMessengerKeysRequestDto } from '@soulsync/shared-types/messenger';
import { bytesToBase64Url, base64UrlToBytes, toArrayBuffer } from './bytes';

const DB_NAME = 'soulsync-messenger-keys';
const DB_VERSION = 1;
const IDENTITY_STORE = 'identity';
const SIGNED_PREKEY_STORE = 'signedPrekey';
const SESSION_STORE = 'sessions';

export const MESSENGER_CRYPTO_HEADER_V2 = 2;

type StoredSession = {
  peerUserId: string;
  sendChainKey: string;
  recvChainKey: string;
  sendCounter: number;
  recvCounter: number;
};

type LegacyStoredSession = {
  peerUserId: string;
  chainKey: string;
  sendCounter: number;
  recvCounter: number;
};

export type ThreadMessageCipher = {
  senderId: string;
  ciphertext: string | null;
  nonce: string;
  header: Record<string, unknown>;
  unsentAt?: string | null;
};

function normalizeSession(raw: StoredSession | LegacyStoredSession): StoredSession {
  if ('chainKey' in raw) {
    return {
      peerUserId: raw.peerUserId,
      sendChainKey: raw.chainKey,
      recvChainKey: raw.chainKey,
      sendCounter: raw.sendCounter,
      recvCounter: raw.recvCounter,
    };
  }
  return raw;
}

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

async function idbPut(store: string, key: IDBValidKey | undefined, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const objectStore = tx.objectStore(store);
    if (key === undefined) {
      objectStore.put(value);
    } else {
      objectStore.put(value, key);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
  });
}

async function idbDelete(store: string, key: IDBValidKey): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'));
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
  const raw = await idbGet<StoredSession | LegacyStoredSession>(SESSION_STORE, peerUserId);
  return raw ? normalizeSession(raw) : null;
}

export async function saveSession(session: StoredSession): Promise<void> {
  // `sessions` uses keyPath `peerUserId` — value must be put without an explicit key.
  await idbPut(SESSION_STORE, undefined, session);
}

export async function clearSession(peerUserId: string): Promise<void> {
  await idbDelete(SESSION_STORE, peerUserId);
}

/** Symmetric root: ECDH(local identity, peer identity) — same on both devices. */
async function deriveInitialChainKeyV2(peerIdentityPublicKey: string): Promise<string> {
  const identity = await ensureIdentityKeyPair();
  const peerIdentity = await importPublicSpki(peerIdentityPublicKey);
  const shared = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerIdentity },
    identity.privateKey,
    256,
  );
  return bytesToBase64Url(await crypto.subtle.digest('SHA-256', shared));
}

/** Legacy v1 root (asymmetric — retained for old ciphertext only). */
export async function deriveInitialChainKeyLegacy(
  peerIdentityPublicKey: string,
  peerSignedPreKeyPublic: string,
): Promise<string> {
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
  return bytesToBase64Url(await crypto.subtle.digest('SHA-256', material));
}

/** Test helper: derive v2 root as a party with a given identity private key. */
export async function deriveSharedRootKeyV2AsParty(
  localIdentityPrivateKey: CryptoKey,
  peerIdentityPublicKey: string,
): Promise<string> {
  const peerIdentity = await importPublicSpki(peerIdentityPublicKey);
  const shared = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerIdentity },
    localIdentityPrivateKey,
    256,
  );
  return bytesToBase64Url(await crypto.subtle.digest('SHA-256', shared));
}

export function headerCryptoVersion(header: Record<string, unknown>): 1 | 2 {
  return header.v === MESSENGER_CRYPTO_HEADER_V2 ? 2 : 1;
}

export async function establishSession(
  peerUserId: string,
  peerIdentityPublicKey: string,
  _peerSignedPreKeyPublic: string,
): Promise<StoredSession> {
  const chainKey = await deriveInitialChainKeyV2(peerIdentityPublicKey);
  const session: StoredSession = {
    peerUserId,
    sendChainKey: chainKey,
    recvChainKey: chainKey,
    sendCounter: 0,
    recvCounter: 0,
  };
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

async function decryptPayload(
  chainKey: string,
  counter: number,
  ciphertext: string,
  nonce: string,
): Promise<string> {
  const aesKey = await deriveAesKey(chainKey, counter);
  const ivBytes = base64UrlToBytes(nonce);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(toArrayBuffer(ivBytes)) },
    aesKey,
    toArrayBuffer(base64UrlToBytes(ciphertext)),
  );
  return new TextDecoder().decode(plain);
}

export function readHeaderCounter(header: Record<string, unknown>, fallback: number): number {
  const raw = header.counter;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

type ReplayResult = {
  plainTexts: (string | null)[];
  session: StoredSession;
};

async function replayThread(
  peerUserId: string,
  initialChainKey: string,
  messages: ThreadMessageCipher[],
  currentUserId: string,
): Promise<ReplayResult> {
  let sendChainKey = initialChainKey;
  let recvChainKey = initialChainKey;
  let sendCounter = 0;
  let recvCounter = 0;
  const plainTexts: (string | null)[] = [];

  for (const message of messages) {
    if (message.unsentAt || !message.ciphertext) {
      plainTexts.push(null);
      continue;
    }
    try {
      if (message.senderId === currentUserId) {
        const counter = readHeaderCounter(message.header, sendCounter);
        const plain = await decryptPayload(sendChainKey, counter, message.ciphertext, message.nonce);
        sendCounter = counter + 1;
        sendChainKey = await advanceChainKey(sendChainKey);
        plainTexts.push(plain);
      } else {
        const counter = readHeaderCounter(message.header, recvCounter);
        const plain = await decryptPayload(recvChainKey, counter, message.ciphertext, message.nonce);
        recvCounter = counter + 1;
        recvChainKey = await advanceChainKey(recvChainKey);
        plainTexts.push(plain);
      }
    } catch {
      plainTexts.push(null);
    }
  }

  return {
    plainTexts,
    session: {
      peerUserId,
      sendChainKey,
      recvChainKey,
      sendCounter,
      recvCounter,
    },
  };
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
  const aesKey = await deriveAesKey(session.sendChainKey, counter);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded);
  session.sendCounter += 1;
  session.sendChainKey = await advanceChainKey(session.sendChainKey);
  await saveSession(session);
  return {
    ciphertext: bytesToBase64Url(cipher),
    nonce: bytesToBase64Url(iv),
    header: { v: MESSENGER_CRYPTO_HEADER_V2, counter },
  };
}

/** Replay the full thread in order so sent and received messages decrypt with separate chains. */
export async function decryptThreadForPeer(
  peerUserId: string,
  peerIdentityPublicKey: string,
  peerSignedPreKeyPublic: string,
  messages: ThreadMessageCipher[],
  currentUserId: string,
): Promise<(string | null)[]> {
  const initialV2 = await deriveInitialChainKeyV2(peerIdentityPublicKey);
  const initialLegacy = await deriveInitialChainKeyLegacy(
    peerIdentityPublicKey,
    peerSignedPreKeyPublic,
  );

  const replayV2 = await replayThread(peerUserId, initialV2, messages, currentUserId);
  const replayLegacy = await replayThread(peerUserId, initialLegacy, messages, currentUserId);

  const merged: (string | null)[] = [];
  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];
    if (!message) {
      merged.push(null);
      continue;
    }
    if (message.unsentAt || !message.ciphertext) {
      merged.push(null);
      continue;
    }
    const ver = headerCryptoVersion(message.header);
    if (ver === MESSENGER_CRYPTO_HEADER_V2) {
      merged.push(replayV2.plainTexts[i] ?? null);
    } else {
      merged.push(replayLegacy.plainTexts[i] ?? replayV2.plainTexts[i] ?? null);
    }
  }

  await saveSession(replayV2.session);
  return merged;
}

export type PeerKeyMaterial = {
  identity: string;
  signed: string;
};
