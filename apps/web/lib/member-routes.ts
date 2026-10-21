/** Member-only routes that use the public site shell (header + footer), not the dashboard. */
export const memberRoutes = {
  communities: '/communities',
  community(slug: string) {
    return `/communities/${encodeURIComponent(slug)}`;
  },
  communityMember(slug: string, username: string) {
    return `/communities/${encodeURIComponent(slug)}/members/${encodeURIComponent(username)}`;
  },
  communityMembers(slug: string) {
    return `/communities/${encodeURIComponent(slug)}/members`;
  },
  communitySettings(slug: string) {
    return `/communities/${encodeURIComponent(slug)}/settings`;
  },
  memberBiodata(username: string) {
    return `/biodata/${encodeURIComponent(username.trim().toLowerCase())}`;
  },
} as const;
