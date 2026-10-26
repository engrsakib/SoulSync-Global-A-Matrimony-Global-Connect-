export type JwtPayload = {
  sub: string;
  tenantId: string;
  role: string;
  /** Auth session id (refresh rotation + logout). */
  sid?: string;
};

export type RefreshJwtPayload = JwtPayload & {
  typ: 'refresh';
};

export type SocketJwtPayload = JwtPayload & {
  typ: 'socket';
};

export type PublicUser = {
  id: string;
  /** Verified contact email; null for guest placeholder addresses. */
  email: string | null;
  hasVerifiedEmail: boolean;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  isGuest: boolean;
  role: string;
  status: string;
  hasPassword: boolean;
  avatarUrl: string | null;
  /** Formatted 16-digit login code when stored for this account (read-only). */
  loginCode: string | null;
};

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
  loginCodePlain?: string;
};
