import type { PublicUser } from '@/lib/auth-api';

export function userDisplayLabel(user: PublicUser): string {
  if (user.username) {
    return user.username;
  }
  if (user.isGuest) {
    const suffix = user.lastName?.trim();
    return suffix ? `Guest ${suffix}` : 'Guest';
  }
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.email?.split('@')[0] || 'Account';
}

export function userSecondaryLine(user: PublicUser): string {
  if (user.username) {
    return `@${user.username}`;
  }
  if (user.isGuest) {
    return 'Guest account';
  }
  return user.email ?? 'No email on file';
}

export function userInitials(user: PublicUser): string {
  if (user.username && user.username.length >= 2) {
    return user.username.slice(0, 2).toUpperCase();
  }
  const first = user.firstName?.trim().charAt(0) ?? '';
  const last = user.lastName?.trim().charAt(0) ?? '';
  const combined = `${first}${last}`.toUpperCase();
  if (combined.length >= 1) {
    return combined.length >= 2 ? combined : `${combined}G`.slice(0, 2);
  }
  if (user.isGuest) {
    return 'G';
  }
  return user.email?.charAt(0).toUpperCase() || '?';
}
