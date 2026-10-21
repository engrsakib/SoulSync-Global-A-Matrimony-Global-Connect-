export function buildLegacyEducationSummary(parts: {
  degreeName?: string | null;
  degreeMajor?: string | null;
  institution?: string | null;
}): string | null {
  const segments: string[] = [];
  const degree = parts.degreeName?.trim();
  const major = parts.degreeMajor?.trim();
  const institution = parts.institution?.trim();
  if (degree) {
    segments.push(degree);
  }
  if (major) {
    segments.push(major.startsWith('in ') ? major : `in ${major}`);
  }
  if (institution) {
    segments.push(institution);
  }
  const summary = segments.join(', ').trim();
  return summary || null;
}
