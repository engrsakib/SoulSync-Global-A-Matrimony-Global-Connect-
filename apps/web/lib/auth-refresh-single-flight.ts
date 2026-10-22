let refreshInFlight: { key: string; promise: Promise<unknown> } | null = null;

/** Coalesce concurrent refresh attempts that share the same key (e.g. refresh JWT). */
export async function runKeyedSingleFlight<T>(key: string, task: () => Promise<T>): Promise<T> {
  if (refreshInFlight?.key === key) {
    return refreshInFlight.promise as Promise<T>;
  }
  const promise = task().finally(() => {
    if (refreshInFlight?.key === key) {
      refreshInFlight = null;
    }
  });
  refreshInFlight = { key, promise };
  return promise;
}

/** @internal */
export function resetRefreshSingleFlightForTests(): void {
  refreshInFlight = null;
}
