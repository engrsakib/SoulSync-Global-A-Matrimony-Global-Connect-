import {
  maskEmailValue,
  maskPhoneValue,
  redactResumeSection,
} from '../src/profiles/resume-field-redaction';

describe('resume-field-redaction', () => {
  it('masks phone numbers', () => {
    expect(maskPhoneValue('+8801712345678')).toContain('5678');
    expect(maskPhoneValue('+8801712345678')).toContain('***');
  });

  it('masks emails', () => {
    expect(maskEmailValue('user@example.com')).toBe('u***@example.com');
  });

  it('keeps guardian contacts when section is visible', () => {
    const { section, contactsApplied } = redactResumeSection({
      sectionId: 'guardian_contact',
      title: 'Guardian',
      access: 'visible',
      content: { guardianMobile: '+8801712345678' },
    });
    expect(section.content?.guardianMobile).toBe('+8801712345678');
    expect(contactsApplied).toBe(false);
  });

  it('strips content when section is locked', () => {
    const { section } = redactResumeSection({
      sectionId: 'faith',
      title: 'Faith',
      access: 'locked',
      content: { note: 'secret' },
    });
    expect(section.content).toBeUndefined();
  });

  it('masks location postal fields when visible', () => {
    const { section, contactsApplied } = redactResumeSection({
      sectionId: 'location',
      title: 'Location',
      access: 'visible',
      content: {
        city: 'Dhaka',
        postalCode: '1207',
        locationDetails: 'Near park',
      },
    });
    expect(section.content?.city).toBe('Dhaka');
    expect(section.content?.postalCode).toBeNull();
    expect(section.content?.locationDetails).toBeNull();
    expect(contactsApplied).toBe(true);
  });
});
