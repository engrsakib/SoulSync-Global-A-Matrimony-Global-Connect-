import { resolveAccessRequestRequesterName } from '../biodata-visibility/access-request-requester-name';

export type EditorGrantMemberLabelInput = {
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileDisplayName?: string | null;
};

export function resolveEditorGrantMemberLabel(
  user: EditorGrantMemberLabelInput,
  decrypt: (stored: string | null | undefined) => string | null,
): string | null {
  const resolved = resolveAccessRequestRequesterName({
    profileDisplayName: user.profileDisplayName,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    decrypt,
  });

  if (resolved === 'Member' && !user.username) {
    return null;
  }

  const profileName = user.profileDisplayName?.trim();
  const decryptedProfile = profileName ? (decrypt(profileName) ?? profileName).trim() : '';
  const legalName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

  if (decryptedProfile || legalName) {
    return decryptedProfile || legalName;
  }

  if (user.username) {
    return `@${user.username.replace(/^@+/, '')}`;
  }

  return null;
}
