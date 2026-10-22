export type AccessRequestRequesterNameInput = {
  profileDisplayName: string | null | undefined;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  decrypt: (stored: string | null | undefined) => string | null;
};

export function resolveAccessRequestRequesterName(input: AccessRequestRequesterNameInput): string {
  const rawDisplay = input.profileDisplayName?.trim();
  const decryptedDisplay = rawDisplay ? (input.decrypt(rawDisplay) ?? rawDisplay).trim() : '';

  return (
    decryptedDisplay ||
    [input.firstName, input.lastName].filter(Boolean).join(' ').trim() ||
    input.username ||
    'Member'
  );
}
