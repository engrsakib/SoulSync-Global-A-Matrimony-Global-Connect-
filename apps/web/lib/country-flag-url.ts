/** PNG flag URL from flagcdn (ISO 3166-1 alpha-2, lowercase in path). */
export function countryFlagUrl(iso2: string, width = 40): string {
  return `https://flagcdn.com/w${width}/${iso2.toLowerCase()}.png`;
}
