export type BmiCategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese';

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) {
    return 'Underweight';
  }
  if (bmi < 25) {
    return 'Normal';
  }
  if (bmi < 30) {
    return 'Overweight';
  }
  return 'Obese';
}

/** BMI from height (cm) and weight (kg); null when inputs are missing or invalid. */
export function computeBmi(
  heightCm: number | null | undefined,
  weightKg: number | null | undefined,
): number | null {
  if (heightCm == null || weightKg == null || heightCm <= 0 || weightKg <= 0) {
    return null;
  }
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  if (!Number.isFinite(bmi)) {
    return null;
  }
  return Math.round(bmi * 10) / 10;
}

export function formatBmiDisplay(
  heightCm: number | null | undefined,
  weightKg: number | null | undefined,
): string {
  const bmi = computeBmi(heightCm, weightKg);
  if (bmi == null) {
    return '—';
  }
  return `${bmi} (${bmiCategory(bmi)})`;
}

export function formatHealthConditionDisplay(profile: {
  hasChronicConditions: boolean | null;
  chronicConditionsDetail: string | null;
}): string {
  if (profile.hasChronicConditions === true) {
    const detail = profile.chronicConditionsDetail?.trim();
    return detail ? `Yes — ${detail}` : 'Yes';
  }
  if (profile.hasChronicConditions === false) {
    return 'No';
  }
  return '—';
}
