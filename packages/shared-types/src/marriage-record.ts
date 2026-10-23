import type { Gender } from './partner-preference';
import { isValidMobileNumber, parseStoredPhone, type CountryCode } from './phone';
import { normalizeMessagingUsername } from './guardian-contact';

export const MARRIAGE_RECORD_STATUSES = ['DRAFT', 'CONFIRMED', 'DIVORCED', 'DECEASED'] as const;
export type MarriageRecordStatus = (typeof MARRIAGE_RECORD_STATUSES)[number];

export const MARRIAGE_SPOUSE_ROLES = ['WIFE', 'HUSBAND'] as const;
export type MarriageSpouseRole = (typeof MARRIAGE_SPOUSE_ROLES)[number];

export const MARRIAGE_RECORD_MAX_CHILDREN = 20;

export type MarriageRecordChildDto = {
  name: string;
  gender: Gender;
  dateOfBirth: string;
};

export type MarriageRecordDto = {
  id: string;
  slotIndex: number;
  spouseRole: MarriageSpouseRole;
  status: MarriageRecordStatus;
  marriageDate: string | null;
  spouseName: string | null;
  spousePhone: string | null;
  spouseTelegram: string | null;
  spouseWhatsApp: string | null;
  partnerUsername: string | null;
  linkedPartnerUserId: string | null;
  marriageConfirmationId: string | null;
  children: MarriageRecordChildDto[];
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MarriageRecordListDto = {
  viewerUserId: string;
  gender: Gender | null;
  maxSlots: number;
  showMarriagePartnerOnPublicBiodata: boolean;
  records: MarriageRecordDto[];
  /** Lowest slot index (1-based) that may be edited as draft, or null if none. */
  nextEditableSlot: number | null;
};

export type UpsertMarriageRecordDraftDto = {
  spouseName?: string;
  marriageDate?: string;
  spousePhone?: string;
  spouseTelegram?: string;
  spouseWhatsApp?: string;
  partnerUsername?: string;
  children?: MarriageRecordChildDto[];
};

export type ConfirmMarriageRecordDto = {
  acknowledgeIrreversible: boolean;
};

export type UpdateMarriageRecordStatusDto = {
  status: 'DIVORCED' | 'DECEASED';
};

export function maxMarriageSlotsForGender(gender: Gender | null | undefined): number {
  if (gender === 'MALE') {
    return 4;
  }
  if (gender === 'FEMALE') {
    return 1;
  }
  return 0;
}

export function spouseRoleForProfileGender(gender: Gender | null | undefined): MarriageSpouseRole {
  return gender === 'FEMALE' ? 'HUSBAND' : 'WIFE';
}

export function normalizeMarriageRecordMessaging(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  const asPhone = parseStoredPhone(trimmed, 'BD');
  if (asPhone) {
    return asPhone.e164;
  }
  const username = normalizeMessagingUsername(trimmed);
  return username || null;
}

export function normalizeMarriageRecordPhone(
  value: string | undefined,
  defaultCountry: CountryCode = 'BD',
): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return '';
  }
  const parsed = parseStoredPhone(trimmed, defaultCountry);
  return parsed?.e164 ?? trimmed;
}

export type MarriageRecordConfirmValidation =
  | {
      ok: true;
      normalized: {
        spouseName: string;
        marriageDate: string;
        spousePhone: string;
        spouseTelegram: string | null;
        spouseWhatsApp: string | null;
        partnerUsername: string | null;
        children: MarriageRecordChildDto[];
      };
    }
  | {
      ok: false;
      message: string;
    };

export function validateMarriageRecordForConfirm(
  draft: UpsertMarriageRecordDraftDto,
  defaultCountry: CountryCode = 'BD',
): MarriageRecordConfirmValidation {
  const spouseName = draft.spouseName?.trim() ?? '';
  if (!spouseName) {
    return { ok: false, message: 'Spouse name is required' };
  }
  const marriageDate = draft.marriageDate?.trim() ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(marriageDate)) {
    return { ok: false, message: 'Marriage date must be YYYY-MM-DD' };
  }
  const spousePhone = normalizeMarriageRecordPhone(draft.spousePhone, defaultCountry);
  if (!isValidMobileNumber(spousePhone, defaultCountry)) {
    return { ok: false, message: 'A valid spouse mobile number is required' };
  }
  const spouseTelegram = normalizeMarriageRecordMessaging(draft.spouseTelegram);
  const spouseWhatsApp = normalizeMarriageRecordMessaging(draft.spouseWhatsApp);
  const partnerUsername = draft.partnerUsername?.trim().replace(/^@+/, '').toLowerCase() || null;
  const children = draft.children ?? [];
  if (children.length > MARRIAGE_RECORD_MAX_CHILDREN) {
    return { ok: false, message: `At most ${MARRIAGE_RECORD_MAX_CHILDREN} children allowed` };
  }
  for (const child of children) {
    if (!child.name?.trim()) {
      return { ok: false, message: 'Each child needs a name' };
    }
    if (!child.dateOfBirth?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(child.dateOfBirth.trim())) {
      return { ok: false, message: 'Each child needs a valid date of birth (YYYY-MM-DD)' };
    }
    if (child.gender !== 'MALE' && child.gender !== 'FEMALE') {
      return { ok: false, message: 'Each child needs a gender' };
    }
  }
  return {
    ok: true,
    normalized: {
      spouseName,
      marriageDate,
      spousePhone,
      spouseTelegram,
      spouseWhatsApp,
      partnerUsername,
      children: children.map((c) => ({
        name: c.name.trim(),
        gender: c.gender,
        dateOfBirth: c.dateOfBirth.trim(),
      })),
    },
  };
}
