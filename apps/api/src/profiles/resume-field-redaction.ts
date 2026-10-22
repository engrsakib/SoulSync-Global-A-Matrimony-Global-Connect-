import type { MemberBiodataViewSectionDto } from '@soulsync/shared-types/biodata-view';

const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function maskPhoneValue(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) {
    return '****';
  }
  const lastFour = digits.slice(-4);
  if (value.trim().startsWith('+')) {
    return `+*** **** ${lastFour}`;
  }
  return `**** ${lastFour}`;
}

export function maskEmailValue(value: string): string {
  const trimmed = value.trim();
  if (!EMAIL_LIKE.test(trimmed)) {
    return '***';
  }
  const at = trimmed.indexOf('@');
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const maskedLocal = local.length <= 1 ? '*' : `${local[0]}***`;
  return `${maskedLocal}@${domain}`;
}

function maskStringField(key: string, value: unknown): unknown {
  if (typeof value !== 'string' || value.trim() === '') {
    return value;
  }
  const lowerKey = key.toLowerCase();
  if (
    lowerKey.includes('mobile') ||
    lowerKey.includes('whatsapp') ||
    lowerKey.includes('telegram')
  ) {
    return maskPhoneValue(value);
  }
  if (lowerKey.includes('email') || EMAIL_LIKE.test(value)) {
    return maskEmailValue(value);
  }
  if (lowerKey === 'postalcode' || lowerKey === 'locationdetails') {
    return null;
  }
  return value;
}

function redactContentObject(
  content: Record<string, unknown>,
  options: { maskContacts: boolean; maskLocationDetails: boolean },
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...content };
  for (const [key, value] of Object.entries(next)) {
    if (options.maskContacts || options.maskLocationDetails) {
      next[key] = maskStringField(key, value);
    }
  }
  return next;
}

export function redactResumeSection(section: MemberBiodataViewSectionDto): {
  section: MemberBiodataViewSectionDto;
  contactsApplied: boolean;
} {
  if (!section.content) {
    return { section, contactsApplied: false };
  }

  const sectionId = section.sectionId;
  const access = section.access;

  if (access === 'visible' && sectionId === 'guardian_contact') {
    return { section, contactsApplied: false };
  }

  if (access !== 'visible') {
    return { section: { ...section, content: undefined }, contactsApplied: false };
  }

  if (sectionId === 'location') {
    const content = redactContentObject(section.content, {
      maskContacts: false,
      maskLocationDetails: true,
    });
    return {
      section: { ...section, content },
      contactsApplied: Boolean(content.postalCode === null && section.content.postalCode),
    };
  }

  if (sectionId === 'guardian_contact') {
    const content = redactContentObject(section.content, {
      maskContacts: true,
      maskLocationDetails: false,
    });
    return { section: { ...section, content }, contactsApplied: true };
  }

  let contactsApplied = false;
  const content: Record<string, unknown> = { ...section.content };
  for (const [key, value] of Object.entries(content)) {
    if (typeof value !== 'string') {
      continue;
    }
    const masked = maskStringField(key, value);
    if (masked !== value) {
      contactsApplied = true;
      content[key] = masked;
    }
  }
  return { section: { ...section, content }, contactsApplied };
}

export function redactResumeSections(sections: MemberBiodataViewSectionDto[]): {
  sections: MemberBiodataViewSectionDto[];
  contactsApplied: boolean;
} {
  let contactsApplied = false;
  const redacted = sections.map((section) => {
    const result = redactResumeSection(section);
    contactsApplied = contactsApplied || result.contactsApplied;
    return result.section;
  });
  return { sections: redacted, contactsApplied };
}
