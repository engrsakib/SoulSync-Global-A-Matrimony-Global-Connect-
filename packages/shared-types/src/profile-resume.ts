import type { MemberBiodataViewDto } from './biodata-view';

export type ProfileResumeRedactionMetaDto = {
  /** True when contact/location detail fields were masked for this response. */
  contactsApplied: boolean;
};

export type ProfileResumeDto = MemberBiodataViewDto & {
  redaction: ProfileResumeRedactionMetaDto;
};
