export type JwtPayload = {
  sub: string;
  tenantId: string;
  role: string;
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
};

export type AuthResult = {
  accessToken: string;
  user: PublicUser;
  loginCodePlain?: string;
};
