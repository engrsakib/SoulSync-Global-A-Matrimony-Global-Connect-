export type SearchableSelectOptionLike = {
  value: string;
  label: string;
};

/** When the full list is huge, nudge users to type before scrolling the whole set. */
export const SEARCHABLE_SELECT_LARGE_LIST_THRESHOLD = 300;

export function filterSearchableSelectOptions<T extends SearchableSelectOptionLike>(
  options: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return options;
  }
  return options.filter((o) => o.label.toLowerCase().includes(q));
}
