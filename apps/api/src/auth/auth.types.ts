export type JwtPayload = {
  sub: string;
  tenantId: string;
  role: string;
};

export type PublicUser = {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  isGuest: boolean;
  role: string;
  status: string;
  hasPassword: boolean;
};

export type AuthResult = {
  accessToken: string;
  user: PublicUser;
  loginCodePlain?: string;
};
