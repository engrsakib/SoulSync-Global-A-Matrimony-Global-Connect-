import { resolveAccessRequestRequesterName } from '../src/biodata-visibility/access-request-requester-name';

describe('resolveAccessRequestRequesterName', () => {
  it('uses decrypted profile display name when present', () => {
    const name = resolveAccessRequestRequesterName({
      profileDisplayName: 'enc:v1:ciphertext',
      firstName: 'Plain',
      lastName: 'Name',
      username: 'tamanna',
      decrypt: (stored) => (stored === 'enc:v1:ciphertext' ? 'Tamanna Khan' : null),
    });
    expect(name).toBe('Tamanna Khan');
  });

  it('falls back to user names then username', () => {
    expect(
      resolveAccessRequestRequesterName({
        profileDisplayName: null,
        firstName: 'Sakib',
        lastName: 'Khan',
        username: 'sakib',
        decrypt: () => null,
      }),
    ).toBe('Sakib Khan');

    expect(
      resolveAccessRequestRequesterName({
        profileDisplayName: '',
        firstName: null,
        lastName: null,
        username: 'member1',
        decrypt: () => null,
      }),
    ).toBe('member1');
  });
});
