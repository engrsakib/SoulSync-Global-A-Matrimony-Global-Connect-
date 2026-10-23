import type { Gender } from './partner-preference';
import type { MarriageRecordListDto } from './marriage-record';

export const MARRIAGE_CONFIRMATION_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'DECLINED',
  'CANCELLED',
  'DIVORCED',
  'DECEASED',
] as const;

export type MarriageConfirmationStatus = (typeof MARRIAGE_CONFIRMATION_STATUSES)[number];

export type MarriageConfirmationUserDto = {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type MarriageConfirmationDto = {
  id: string;
  status: MarriageConfirmationStatus;
  marriageDate: string;
  initiatorUserId: string;
  partnerUserId: string | null;
  initiatedAt: string;
  respondedAt: string | null;
  confirmedAt: string | null;
  divorceRequestedByUserId: string | null;
  divorceRequestedAt: string | null;
  initiator: MarriageConfirmationUserDto;
  partner: MarriageConfirmationUserDto | null;
};

export type MarriageConfirmationListDto = {
  viewerUserId: string;
  pendingIncoming: MarriageConfirmationDto[];
  pendingOutgoing: MarriageConfirmationDto[];
  confirmed: MarriageConfirmationDto[];
  history: MarriageConfirmationDto[];
};

export type CreateMarriageConfirmationDto = {
  partnerUsername: string;
  marriageDate: string;
};

export type MemberConfirmedMarriageDto = {
  marriageDate: string;
  partner: MarriageConfirmationUserDto | null;
};

export type MarriageConfirmationPartySoulSyncDto = {
  confirmed: MarriageConfirmationDto[];
  history: MarriageConfirmationDto[];
};

export type MarriageConfirmationPartyReviewDto = {
  userId: string;
  displayName: string | null;
  gender: Gender | null;
  registry: MarriageRecordListDto;
  soulSync: MarriageConfirmationPartySoulSyncDto;
};

/** Full registry + SoulSync summary for both parties while a request is PENDING. */
export type MarriageConfirmationReviewDto = {
  confirmation: MarriageConfirmationDto;
  initiator: MarriageConfirmationPartyReviewDto;
  partner: MarriageConfirmationPartyReviewDto;
};
