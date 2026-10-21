const CM_PER_INCH = 2.54;

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / CM_PER_INCH);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = Math.max(0, feet) * 12 + Math.max(0, inches);
  return Math.round(totalInches * CM_PER_INCH);
}

export function formatHeightFromCm(cm: number | null | undefined): string {
  if (cm == null || cm <= 0) {
    return '—';
  }
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}′ ${inches}″ (${cm} cm)`;
}

export function parseFeetInchesFields(feetRaw: string, inchesRaw: string): number | null {
  const hasFeet = feetRaw.trim().length > 0;
  const hasInches = inchesRaw.trim().length > 0;
  if (!hasFeet && !hasInches) {
    return null;
  }
  const feet = hasFeet ? Number(feetRaw) : 0;
  const inches = hasInches ? Number(inchesRaw) : 0;
  if (!Number.isFinite(feet) || !Number.isFinite(inches) || feet < 0 || inches < 0) {
    return null;
  }
  const cm = feetInchesToCm(feet, inches);
  return cm > 0 ? cm : null;
}
