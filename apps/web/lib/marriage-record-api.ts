import { readApiErrorMessage } from '@soulsync/shared-types';
import type {
  ConfirmMarriageRecordDto,
  MarriageRecordDto,
  MarriageRecordListDto,
  UpdateMarriageRecordStatusDto,
  UpsertMarriageRecordDraftDto,
} from '@soulsync/shared-types/marriage-record';
import { unwrapBffPayload } from '@/lib/bff-unwrap';
import { bffFetch } from '@/lib/bff-fetch';

async function parseJson(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}));
}

export async function fetchMarriageRecords(): Promise<MarriageRecordListDto> {
  const response = await bffFetch('/api/marriage-records/me', { cache: 'no-store' });
  const raw = await parseJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Could not load marriage records'));
  }
  return unwrapBffPayload<MarriageRecordListDto>(raw);
}

export async function upsertMarriageRecordDraft(
  slotIndex: number,
  body: UpsertMarriageRecordDraftDto,
): Promise<MarriageRecordDto> {
  const response = await bffFetch(`/api/marriage-records/slots/${slotIndex}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const raw = await parseJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Could not save draft'));
  }
  return unwrapBffPayload<MarriageRecordDto>(raw);
}

export async function confirmMarriageRecordSlot(
  slotIndex: number,
  body: ConfirmMarriageRecordDto,
): Promise<MarriageRecordDto> {
  const response = await bffFetch(`/api/marriage-records/slots/${slotIndex}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const raw = await parseJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Could not confirm marriage'));
  }
  return unwrapBffPayload<MarriageRecordDto>(raw);
}

export async function updateMarriageRecordStatus(
  recordId: string,
  body: UpdateMarriageRecordStatusDto,
): Promise<MarriageRecordDto> {
  const response = await bffFetch(`/api/marriage-records/${encodeURIComponent(recordId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const raw = await parseJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Could not update status'));
  }
  return unwrapBffPayload<MarriageRecordDto>(raw);
}
