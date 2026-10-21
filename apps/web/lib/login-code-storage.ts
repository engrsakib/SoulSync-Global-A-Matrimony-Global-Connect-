const STORAGE_KEY = 'soulsync_login_codes';

function readMap(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

export function saveLoginCodeForUser(userId: string, plainCode: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  const map = readMap();
  map[userId] = plainCode.replace(/\D/g, '');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getStoredLoginCode(userId: string): string | null {
  const digits = readMap()[userId];
  return digits && digits.length > 0 ? digits : null;
}
