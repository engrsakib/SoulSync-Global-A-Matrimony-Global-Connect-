export const communityActivityUserSelect = {
  id: true,
  tenantId: true,
  username: true,
  firstName: true,
  lastName: true,
  profile: { select: { displayName: true } },
} as const;
