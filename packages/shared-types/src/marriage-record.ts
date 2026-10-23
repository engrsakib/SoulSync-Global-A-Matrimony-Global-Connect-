import type { Gender } from './partner-preference';
import { isValidMobileNumber, parseStoredPhone, type CountryCode } from './phone';
import { normalizeMessagingUsername } from './guardian-contact';

export const MARRIAGE_RECORD_STATUSES = ['DRAFT', 'CONFIRMED', 'DIVORCED', 'DECEASED'] as const;
export type MarriageRecordStatus = (typeof MARRIAGE_RECORD_STATUSES)[number];

export const MARRIAGE_SPOUSE_ROLES = ['WIFE', 'HUSBAND'] as const;
export type MarriageSpouseRole = (typeof MARRIAGE_SPOUSE_ROLES)[number];

export const MARRIAGE_RECORD_MAX_CHILDREN = 20;
export const MARRIAGE_CHILD_MIN_DAYS_AFTER_MARRIAGE = 210;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDateString(value: string | undefined | null): boolean {
  const trimmed = value?.trim() ?? '';
  if (!ISO_DATE_RE.test(trimmed)) {
    return false;
  }
  const parts = trimmed.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y == null || m == null || d == null) {
    return false;
  }
  const ms = Date.UTC(y, m - 1, d);
  const check = new Date(ms);
  return check.getUTCFullYear() === y && check.getUTCMonth() === m - 1 && check.getUTCDate() === d;
}

export function parseIsoDateToUtcMs(iso: string): number | null {
  if (!isIsoDateString(iso)) {
    return null;
  }
  const parts = iso.trim().split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y == null || m == null || d == null) {
    return null;
  }
  return Date.UTC(y, m - 1, d);
}

export function formatUtcMsToIsoDate(ms: number): string {
  const date = new Date(ms);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysToIsoDate(iso: string, days: number): string | null {
  const ms = parseIsoDateToUtcMs(iso);
  if (ms == null) {
    return null;
  }
  return formatUtcMsToIsoDate(ms + days * 86_400_000);
}

export function isoDateTodayUtc(): string {
  return formatUtcMsToIsoDate(Date.now());
}

export function compareIsoDates(a: string, b: string): number {
  return (parseIsoDateToUtcMs(a) ?? 0) - (parseIsoDateToUtcMs(b) ?? 0);
}

export type MarriageRecordChildDto = {
  name: string;
  gender: Gender;
  dateOfBirth: string;
  /** When the member has multiple wives, which slot (1–4) is the mother. Omitted when only one spouse. */
  motherSlotIndex?: number;
};

export type MarriageRecordDto = {
  id: string;
  slotIndex: number;
  spouseRole: MarriageSpouseRole;
  status: MarriageRecordStatus;
  marriageDate: string | null;
  /** When status is DIVORCED or DECEASED — YYYY-MM-DD */
  statusEndedDate: string | null;
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

export type MarriageRecordArchiveDto = Omit<MarriageRecordDto, 'slotIndex' | 'status'> & {
  originalSlotIndex: number;
  endedStatus: Extract<MarriageRecordStatus, 'DIVORCED' | 'DECEASED'>;
  archivedAt: string;
};

export type MarriageRecordListDto = {
  viewerUserId: string;
  gender: Gender | null;
  maxSlots: number;
  showMarriagePartnerOnPublicBiodata: boolean;
  records: MarriageRecordDto[];
  archivedRecords: MarriageRecordArchiveDto[];
  /** Lowest slot index (1-based) that may be edited as draft, or null if none. */
  nextEditableSlot: number | null;
};

export type UpsertMarriageRecordChildrenBatchDto = {
  slots: { slotIndex: number; children: MarriageRecordChildDto[] }[];
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
  statusEndedDate: string;
};

export type MotherMarriageContext = {
  slotIndex: number;
  marriageDate: string | null;
  status: MarriageRecordStatus | 'MISSING';
  statusEndedDate: string | null;
  spouseName: string | null;
};

export function resolveMotherMarriageContext(
  slotIndex: number,
  records: MarriageRecordDto[],
  draftMarriageDatesBySlot?: Record<number, string>,
): MotherMarriageContext {
  const record = records.find((r) => r.slotIndex === slotIndex);
  const draftDate = draftMarriageDatesBySlot?.[slotIndex]?.trim();
  let marriageDate = record?.marriageDate?.trim() ?? null;
  if (!marriageDate && draftDate && isIsoDateString(draftDate)) {
    marriageDate = draftDate;
  }
  return {
    slotIndex,
    marriageDate,
    status: record?.status ?? 'MISSING',
    statusEndedDate: record?.statusEndedDate?.trim() ?? null,
    spouseName: record?.spouseName?.trim() ?? null,
  };
}

export function childDateOfBirthBounds(
  context: MotherMarriageContext,
): { ok: true; minIso: string; maxIso: string } | { ok: false; message: string } {
  if (!context.marriageDate || !isIsoDateString(context.marriageDate)) {
    const label = context.spouseName?.trim() || `wife slot ${context.slotIndex}`;
    return {
      ok: false,
      message: `Set the marriage date for ${label} before adding or editing a child.`,
    };
  }
  const minIso = addDaysToIsoDate(context.marriageDate, MARRIAGE_CHILD_MIN_DAYS_AFTER_MARRIAGE);
  if (!minIso) {
    return { ok: false, message: 'Invalid marriage date on file for this mother.' };
  }
  const today = isoDateTodayUtc();
  let maxIso = today;
  if (context.status === 'DIVORCED' || context.status === 'DECEASED') {
    if (context.statusEndedDate && isIsoDateString(context.statusEndedDate)) {
      maxIso = context.statusEndedDate;
    }
  }
  if (compareIsoDates(minIso, maxIso) > 0) {
    return {
      ok: false,
      message: 'Marriage and end dates on file do not allow a valid child date of birth.',
    };
  }
  return { ok: true, minIso, maxIso };
}

export function validateChildDateOfBirth(
  child: MarriageRecordChildDto,
  records: MarriageRecordDto[],
  draftMarriageDatesBySlot?: Record<number, string>,
  defaultMotherSlot = 1,
): { ok: true } | { ok: false; message: string } {
  const dob = child.dateOfBirth?.trim() ?? '';
  if (!isIsoDateString(dob)) {
    return { ok: false, message: 'Each child needs a valid date of birth (YYYY-MM-DD).' };
  }
  const motherSlot =
    child.motherSlotIndex != null && child.motherSlotIndex >= 1
      ? child.motherSlotIndex
      : defaultMotherSlot;
  const context = resolveMotherMarriageContext(motherSlot, records, draftMarriageDatesBySlot);
  const bounds = childDateOfBirthBounds(context);
  if (!bounds.ok) {
    return bounds;
  }
  if (compareIsoDates(dob, bounds.minIso) < 0) {
    return {
      ok: false,
      message: `Date of birth for ${child.name.trim() || 'child'} must be at least ${MARRIAGE_CHILD_MIN_DAYS_AFTER_MARRIAGE} days after the marriage date (${context.marriageDate}). Earliest allowed: ${bounds.minIso}.`,
    };
  }
  if (compareIsoDates(dob, bounds.maxIso) > 0) {
    const endHint =
      context.status === 'DIVORCED' || context.status === 'DECEASED'
        ? `before the ${context.status === 'DECEASED' ? 'date of passing' : 'divorce date'} (${bounds.maxIso})`
        : `on or before today (${bounds.maxIso})`;
    return {
      ok: false,
      message: `Date of birth for ${child.name.trim() || 'child'} must be ${endHint}.`,
    };
  }
  return { ok: true };
}

export function validateStatusEndedDate(
  marriageDate: string | null | undefined,
  statusEndedDate: string,
): { ok: true; normalized: string } | { ok: false; message: string } {
  const normalized = statusEndedDate.trim();
  if (!isIsoDateString(normalized)) {
    return { ok: false, message: 'End date must be YYYY-MM-DD.' };
  }
  const today = isoDateTodayUtc();
  if (compareIsoDates(normalized, today) > 0) {
    return { ok: false, message: 'End date cannot be in the future.' };
  }
  const marriage = marriageDate?.trim();
  if (marriage && isIsoDateString(marriage) && compareIsoDates(normalized, marriage) < 0) {
    return { ok: false, message: 'End date cannot be before the marriage date.' };
  }
  return { ok: true, normalized };
}

export function validateMarriageRecordChildrenBatch(
  children: MarriageRecordChildDto[],
  records: MarriageRecordDto[],
  draftMarriageDatesBySlot?: Record<number, string>,
): { ok: true } | { ok: false; message: string } {
  for (const child of children) {
    if (!child.name?.trim()) {
      return { ok: false, message: 'Each child needs a name.' };
    }
    if (child.gender !== 'MALE' && child.gender !== 'FEMALE') {
      return { ok: false, message: 'Each child needs a gender.' };
    }
    const dobCheck = validateChildDateOfBirth(child, records, draftMarriageDatesBySlot);
    if (!dobCheck.ok) {
      return dobCheck;
    }
  }
  return { ok: true };
}

export type UpdateMarriageRecordPublicPartnerDto = {
  showMarriagePartnerOnPublicBiodata: boolean;
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

export function countRegistryConfirmedMarriages(
  records: ReadonlyArray<Pick<MarriageRecordDto, 'status'>>,
): number {
  return records.filter((record) => record.status === 'CONFIRMED').length;
}

export function countUnlinkedSoulSyncConfirmations(
  confirmedRows: ReadonlyArray<{ id: string }>,
  linkedConfirmationIds: ReadonlySet<string> | ReadonlyArray<string>,
): number {
  const linked =
    linkedConfirmationIds instanceof Set ? linkedConfirmationIds : new Set(linkedConfirmationIds);
  return confirmedRows.filter((row) => !linked.has(row.id)).length;
}

/** Matches API capacity: male = registry CONFIRMED only; female = registry + unlinked SoulSync CONFIRMED. */
export function countActiveMarriagesForCapacity(
  gender: Gender | null | undefined,
  records: ReadonlyArray<Pick<MarriageRecordDto, 'status'>>,
  confirmedSoulSyncRows: ReadonlyArray<{ id: string }>,
  linkedConfirmationIds: ReadonlySet<string> | ReadonlyArray<string>,
): number {
  const registryActive = countRegistryConfirmedMarriages(records);
  if (gender === 'MALE') {
    return registryActive;
  }
  return (
    registryActive +
    countUnlinkedSoulSyncConfirmations(confirmedSoulSyncRows, linkedConfirmationIds)
  );
}

export function spouseRoleForProfileGender(gender: Gender | null | undefined): MarriageSpouseRole {
  return gender === 'FEMALE' ? 'HUSBAND' : 'WIFE';
}

const ENDED_MARRIAGE_STATUSES: MarriageRecordStatus[] = ['DIVORCED', 'DECEASED'];

export function canUpdateChildrenOnMarriageRecord(
  status: MarriageRecordStatus | undefined,
): boolean {
  return (
    status === 'DRAFT' || status === 'CONFIRMED' || status === 'DIVORCED' || status === 'DECEASED'
  );
}

export function isMarriageRecordSlotOccupiedForProgression(
  status: MarriageRecordStatus | undefined,
): boolean {
  if (!status) {
    return false;
  }
  return status === 'CONFIRMED' || ENDED_MARRIAGE_STATUSES.includes(status);
}

/** Next slot the member may draft or reopen (ended slot → begin-remarriage). */
export function resolveNextEditableMarriageSlot(
  gender: Gender | null | undefined,
  records: Pick<MarriageRecordDto, 'slotIndex' | 'status'>[],
  maxSlots: number,
): number | null {
  if (maxSlots <= 0) {
    return null;
  }
  const bySlot = new Map(records.map((r) => [r.slotIndex, r]));
  const confirmedCount = records.filter((r) => r.status === 'CONFIRMED').length;

  for (let slot = 1; slot <= maxSlots; slot += 1) {
    if (bySlot.get(slot)?.status === 'DRAFT') {
      return slot;
    }
  }

  if (gender === 'MALE' && confirmedCount < maxSlots) {
    for (let slot = 1; slot <= maxSlots; slot += 1) {
      const status = bySlot.get(slot)?.status;
      if (status === 'DIVORCED' || status === 'DECEASED') {
        return slot;
      }
    }
  }

  for (let slot = 1; slot <= maxSlots; slot += 1) {
    const record = bySlot.get(slot);
    if (!record) {
      if (slot === 1) {
        return 1;
      }
      const prev = bySlot.get(slot - 1);
      if (isMarriageRecordSlotOccupiedForProgression(prev?.status)) {
        return slot;
      }
      return null;
    }
    if (isMarriageRecordSlotOccupiedForProgression(record.status) && slot < maxSlots) {
      continue;
    }
    if (
      gender === 'FEMALE' &&
      slot === 1 &&
      isMarriageRecordSlotOccupiedForProgression(record.status)
    ) {
      return null;
    }
  }
  return null;
}

export function normalizeChildForStorage(
  child: MarriageRecordChildDto,
  defaultMotherSlot: number,
): MarriageRecordChildDto {
  const motherSlotIndex =
    child.motherSlotIndex != null && child.motherSlotIndex >= 1
      ? child.motherSlotIndex
      : defaultMotherSlot;
  return {
    name: child.name.trim(),
    gender: child.gender,
    dateOfBirth: child.dateOfBirth.trim(),
    ...(motherSlotIndex !== defaultMotherSlot ? { motherSlotIndex } : {}),
  };
}

export function groupChildrenByMotherSlot(
  children: MarriageRecordChildDto[],
  defaultSlotIndex: number,
): Map<number, MarriageRecordChildDto[]> {
  const grouped = new Map<number, MarriageRecordChildDto[]>();
  for (const child of children) {
    const slot =
      child.motherSlotIndex != null && child.motherSlotIndex >= 1
        ? child.motherSlotIndex
        : defaultSlotIndex;
    const stored = normalizeChildForStorage(child, slot);
    const list = grouped.get(slot) ?? [];
    list.push({
      name: stored.name,
      gender: stored.gender,
      dateOfBirth: stored.dateOfBirth,
    });
    grouped.set(slot, list);
  }
  return grouped;
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

export type ValidateMarriageRecordOptions = {
  profileGender?: Gender | null;
  /** Slots that already have a spouse name (draft or locked). */
  namedMotherSlots?: number[];
  confirmSlotIndex?: number;
  records?: MarriageRecordDto[];
  draftMarriageDatesBySlot?: Record<number, string>;
};

export function validateMarriageRecordForConfirm(
  draft: UpsertMarriageRecordDraftDto,
  defaultCountry: CountryCode = 'BD',
  options?: ValidateMarriageRecordOptions,
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
  const namedMotherSlots = options?.namedMotherSlots ?? [];
  const confirmSlot = options?.confirmSlotIndex ?? 1;
  const motherSlotsWithNames = new Set(namedMotherSlots);
  if (spouseName) {
    motherSlotsWithNames.add(confirmSlot);
  }
  const multiWife = options?.profileGender === 'MALE' && motherSlotsWithNames.size > 1;

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
    if (multiWife) {
      const motherSlot = child.motherSlotIndex ?? confirmSlot;
      if (!Number.isInteger(motherSlot) || motherSlot < 1 || motherSlot > 4) {
        return { ok: false, message: 'Each child needs a mother (wife) selected' };
      }
    }
    if (options?.records) {
      const dobCheck = validateChildDateOfBirth(
        child,
        options.records,
        options.draftMarriageDatesBySlot,
        confirmSlot,
      );
      if (!dobCheck.ok) {
        return dobCheck;
      }
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

/** Deduped child counts from registry rows and archives (excludes DRAFT). */
export function countUniqueFamilyChildrenFromRegistry(
  records: MarriageRecordDto[],
  archivedRecords: MarriageRecordArchiveDto[],
): { maleChildrenCount: number; femaleChildrenCount: number } {
  const seen = new Set<string>();
  let maleChildrenCount = 0;
  let femaleChildrenCount = 0;

  const ingest = (slotIndex: number, children: MarriageRecordChildDto[] | undefined) => {
    for (const child of children ?? []) {
      const motherSlot = child.motherSlotIndex ?? slotIndex;
      const key = `${motherSlot}:${child.name.trim()}:${child.dateOfBirth}:${child.gender}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      if (child.gender === 'MALE') {
        maleChildrenCount += 1;
      } else {
        femaleChildrenCount += 1;
      }
    }
  };

  for (const record of records) {
    if (record.status === 'DRAFT') {
      continue;
    }
    ingest(record.slotIndex, record.children);
  }
  for (const archive of archivedRecords) {
    ingest(archive.originalSlotIndex, archive.children);
  }

  return { maleChildrenCount, femaleChildrenCount };
}
