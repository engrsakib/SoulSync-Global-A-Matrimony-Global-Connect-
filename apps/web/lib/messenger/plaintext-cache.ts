const DB_NAME = 'soulsync-messenger-plaintext';
const DB_VERSION = 1;
const STORE = 'messagePlaintext';

type PlaintextRow = {
  messageId: string;
  plainText: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'messageId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

export async function rememberSentPlaintext(messageId: string, plainText: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ messageId, plainText } satisfies PlaintextRow);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
  });
}

export async function lookupPlaintext(messageId: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(messageId);
    req.onsuccess = () => {
      const row = req.result as PlaintextRow | undefined;
      resolve(row?.plainText ?? null);
    };
    req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'));
  });
}
