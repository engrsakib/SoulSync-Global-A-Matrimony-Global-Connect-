export const dashboardRoutes = {
  root: '/dashboard',
  profile: '/dashboard/profile',
  profileTransactions: '/dashboard/profile/transactions',
  settings: '/dashboard/settings',
  biodata: '/dashboard/biodata',
  biodataSettings: '/dashboard/biodata/settings',
  biodataPermissionRequests: '/dashboard/biodata/permission-requests',
  biodataManaged: '/dashboard/biodata/managed',
  biodataManagedUser: (username: string) =>
    `/dashboard/biodata/managed/${encodeURIComponent(username.replace(/^@+/, ''))}`,
  biodataManagedUserEdit: (username: string) =>
    `/dashboard/biodata/managed/${encodeURIComponent(username.replace(/^@+/, ''))}/edit`,
  biodataManagedUserSettings: (username: string) =>
    `/dashboard/biodata/managed/${encodeURIComponent(username.replace(/^@+/, ''))}/settings`,
  biodataManagedUserPermissions: (username: string) =>
    `/dashboard/biodata/managed/${encodeURIComponent(username.replace(/^@+/, ''))}/permissions`,
} as const;
