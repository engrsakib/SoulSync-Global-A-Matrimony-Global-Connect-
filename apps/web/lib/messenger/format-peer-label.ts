import type { MessengerPeerSummaryDto } from '@soulsync/shared-types/messenger';
import { isEncryptedDisplayName } from '@/lib/format-requester-display-name';

export function formatMessengerPeerLabel(peer: MessengerPeerSummaryDto): string {
  const display = peer.displayName?.trim();
  if (display && !isEncryptedDisplayName(display)) {
    return display;
  }
  const username = peer.username?.trim().replace(/^@+/, '');
  if (username) {
    return `@${username}`;
  }
  return 'Member';
}

export function formatMessengerPeerSubtitle(peer: MessengerPeerSummaryDto): string | null {
  const label = formatMessengerPeerLabel(peer);
  const username = peer.username?.trim().replace(/^@+/, '');
  if (!username) {
    return null;
  }
  const atUser = `@${username}`;
  if (label === atUser || label === 'Member') {
    return null;
  }
  return atUser;
}

export function peerInitials(peer: MessengerPeerSummaryDto): string {
  const label = formatMessengerPeerLabel(peer).replace(/^@+/, '');
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return (label[0] ?? 'M').toUpperCase();
}
