import type {
  MarriageRecordChildDto,
  MarriageRecordDto,
} from '@soulsync/shared-types/marriage-record';
import type { Prisma } from '@soulsync/db';
import type { FieldEncryptionService } from '../crypto/field-encryption.service';
import {
  formatMarriageDateOnly,
  parseMarriageDateInput,
} from '../marriage-confirmation/marriage-confirmation.util';

type MarriageRecordRow = Prisma.MarriageRecordGetPayload<Record<string, never>>;

function decryptChildren(
  crypto: FieldEncryptionService,
  childrenEnc: Prisma.JsonValue | null,
): MarriageRecordChildDto[] {
  const decoded = crypto.decryptJson(childrenEnc ?? undefined);
  const items = decoded.items;
  if (!Array.isArray(items)) {
    return [];
  }
  const out: MarriageRecordChildDto[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      continue;
    }
    const row = item as Record<string, unknown>;
    const name = typeof row.name === 'string' ? row.name : '';
    const gender = row.gender === 'MALE' || row.gender === 'FEMALE' ? row.gender : null;
    const dateOfBirth = typeof row.dateOfBirth === 'string' ? row.dateOfBirth : '';
    if (name && gender && dateOfBirth) {
      out.push({ name, gender, dateOfBirth });
    }
  }
  return out;
}

export function marriageRecordToDto(
  crypto: FieldEncryptionService,
  row: MarriageRecordRow,
): MarriageRecordDto {
  return {
    id: row.id,
    slotIndex: row.slotIndex,
    spouseRole: row.spouseRole,
    status: row.status,
    marriageDate: row.marriageDate ? formatMarriageDateOnly(row.marriageDate) : null,
    spouseName: crypto.decryptString(row.spouseNameEnc),
    spousePhone: crypto.decryptString(row.spousePhoneEnc),
    spouseTelegram: crypto.decryptString(row.spouseTelegramEnc),
    spouseWhatsApp: crypto.decryptString(row.spouseWhatsAppEnc),
    partnerUsername: row.partnerUsernameHint,
    linkedPartnerUserId: row.linkedPartnerUserId,
    marriageConfirmationId: row.marriageConfirmationId,
    children: decryptChildren(crypto, row.childrenEnc),
    lockedAt: row.lockedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function buildEncryptedMarriageRecordFields(
  crypto: FieldEncryptionService,
  input: {
    spouseName: string;
    spousePhone: string;
    spouseTelegram: string | null;
    spouseWhatsApp: string | null;
    children: MarriageRecordChildDto[];
    marriageDate: string;
  },
): {
  marriageDate: Date;
  spouseNameEnc: string | null;
  spousePhoneEnc: string | null;
  spouseTelegramEnc: string | null;
  spouseWhatsAppEnc: string | null;
  childrenEnc: Prisma.InputJsonValue;
} {
  return {
    marriageDate: parseMarriageDateInput(input.marriageDate),
    spouseNameEnc: crypto.encryptString(input.spouseName),
    spousePhoneEnc: crypto.encryptString(input.spousePhone),
    spouseTelegramEnc: crypto.encryptString(input.spouseTelegram),
    spouseWhatsAppEnc: crypto.encryptString(input.spouseWhatsApp),
    childrenEnc: crypto.encryptJson({ items: input.children }) as Prisma.InputJsonValue,
  };
}

export function buildDraftEncryptedFields(
  crypto: FieldEncryptionService,
  input: {
    spouseName?: string;
    spousePhone?: string;
    spouseTelegram?: string | null;
    spouseWhatsApp?: string | null;
    children?: MarriageRecordChildDto[];
    marriageDate?: string;
  },
): {
  marriageDate?: Date;
  spouseNameEnc?: string | null;
  spousePhoneEnc?: string | null;
  spouseTelegramEnc?: string | null;
  spouseWhatsAppEnc?: string | null;
  childrenEnc?: Prisma.InputJsonValue;
} {
  const data: ReturnType<typeof buildDraftEncryptedFields> = {};
  if (input.marriageDate?.trim()) {
    data.marriageDate = parseMarriageDateInput(input.marriageDate);
  }
  if (input.spouseName !== undefined) {
    data.spouseNameEnc = crypto.encryptString(input.spouseName.trim() || null);
  }
  if (input.spousePhone !== undefined) {
    data.spousePhoneEnc = crypto.encryptString(input.spousePhone.trim() || null);
  }
  if (input.spouseTelegram !== undefined) {
    data.spouseTelegramEnc = crypto.encryptString(input.spouseTelegram);
  }
  if (input.spouseWhatsApp !== undefined) {
    data.spouseWhatsAppEnc = crypto.encryptString(input.spouseWhatsApp);
  }
  if (input.children !== undefined) {
    data.childrenEnc = crypto.encryptJson({ items: input.children }) as Prisma.InputJsonValue;
  }
  return data;
}
