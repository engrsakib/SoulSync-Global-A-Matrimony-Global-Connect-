export const MARRIAGE_CONFIRMATION_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'DECLINED',
  'CANCELLED',
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
  partnerUserId: string;
  initiatedAt: string;
  respondedAt: string | null;
  confirmedAt: string | null;
  initiator: MarriageConfirmationUserDto;
  partner: MarriageConfirmationUserDto;
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
  partner: MarriageConfirmationUserDto;
};
