export const ABOUT_PAGE_REDIS_KEY = 'about:content:v1';

/** Marketing content changes infrequently; 1 hour balances freshness and SSR load. */
export const ABOUT_PAGE_REDIS_TTL_SECONDS = 3600;
