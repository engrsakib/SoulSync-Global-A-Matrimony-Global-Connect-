export type AboutPageSeoDto = {
  title: string;
  description: string;
};

export type AboutPageHeroDto = {
  badge?: string;
  title: string;
  subtitle: string;
};

export type AboutPageTextBlockDto = {
  title: string;
  body: string;
};

export type AboutPagePolicyDto = {
  id: string;
  title: string;
  body: string;
  featured?: boolean;
};

export type AboutPageTeamMemberDto = {
  id: string;
  name: string;
  designation: string;
  bio: string;
  imageSrc: string;
  imageAlt: string;
  /** Unsplash photographer credit for seed metadata */
  photoCredit?: string;
};

export type AboutPageFounderDto = AboutPageTeamMemberDto & {
  location?: string;
};

export type AboutPageTrustPillarDto = {
  id: string;
  title: string;
  body: string;
};

export type AboutPageContentDto = {
  seo: AboutPageSeoDto;
  hero: AboutPageHeroDto;
  goal: AboutPageTextBlockDto;
  mission: AboutPageTextBlockDto;
  policies: AboutPagePolicyDto[];
  founder: AboutPageFounderDto;
  team: AboutPageTeamMemberDto[];
  trustPillars: AboutPageTrustPillarDto[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isAboutPageSeo(value: unknown): value is AboutPageSeoDto {
  return isRecord(value) && isNonEmptyString(value.title) && isNonEmptyString(value.description);
}

function isAboutPageHero(value: unknown): value is AboutPageHeroDto {
  return (
    isRecord(value) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.subtitle) &&
    (value.badge === undefined || isNonEmptyString(value.badge))
  );
}

function isAboutPageTextBlock(value: unknown): value is AboutPageTextBlockDto {
  return isRecord(value) && isNonEmptyString(value.title) && isNonEmptyString(value.body);
}

function isAboutPagePolicy(value: unknown): value is AboutPagePolicyDto {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.body) &&
    (value.featured === undefined || typeof value.featured === 'boolean')
  );
}

function isAboutPageTeamMember(value: unknown): value is AboutPageTeamMemberDto {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.designation) &&
    isNonEmptyString(value.bio) &&
    isNonEmptyString(value.imageSrc) &&
    isNonEmptyString(value.imageAlt) &&
    (value.photoCredit === undefined || isNonEmptyString(value.photoCredit))
  );
}

function isAboutPageFounder(value: unknown): value is AboutPageFounderDto {
  if (!isRecord(value)) {
    return false;
  }
  if (value.location !== undefined && !isNonEmptyString(value.location)) {
    return false;
  }
  return isAboutPageTeamMember(value);
}

function isAboutPageTrustPillar(value: unknown): value is AboutPageTrustPillarDto {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.body)
  );
}

export function isAboutPageContentDto(value: unknown): value is AboutPageContentDto {
  if (!isRecord(value)) {
    return false;
  }
  if (!isAboutPageSeo(value.seo) || !isAboutPageHero(value.hero)) {
    return false;
  }
  if (!isAboutPageTextBlock(value.goal) || !isAboutPageTextBlock(value.mission)) {
    return false;
  }
  if (!Array.isArray(value.policies) || !value.policies.every(isAboutPagePolicy)) {
    return false;
  }
  if (!isAboutPageFounder(value.founder)) {
    return false;
  }
  if (!Array.isArray(value.team) || !value.team.every(isAboutPageTeamMember)) {
    return false;
  }
  if (!Array.isArray(value.trustPillars) || !value.trustPillars.every(isAboutPageTrustPillar)) {
    return false;
  }
  return true;
}
