import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Gender, PasswordChangeSource, Religion, UserStatus, type User } from '@soulsync/db';
import {
  formatLoginCode,
  guestDisplayNameFromLoginCode,
  guestLastNameFromLoginCode,
  isCompleteLoginCode,
  normalizeLoginCode,
  normalizeUsername,
  validateUsername,
  isGuestPlaceholderEmail,
} from '@soulsync/shared-types';
import type { Env } from '../config/env.schema';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthResult, JwtPayload, PublicUser } from './auth.types';
import { LoginCodeService } from './login-code.service';
import { JwtTokenService } from './jwt.service';
import { PasswordService } from './password.service';
import type { GuestLoginDto } from './dto/guest-login.dto';
import type { LoginDto } from './dto/login.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { RegisterDto } from './dto/register.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { UpdateUsernameDto } from './dto/update-username.dto';
import { MediaService } from '../media/media.service';
import type { ActivityLogRequestContext } from '../activity-log/activity-log.context';
import { ActivityLogRecorder } from '../activity-log/activity-log.recorder';
import { AuthSessionService } from './auth-session.service';
import type { UploadedFilePayload, UploadResult } from '../media/media.types';

const GUEST_EMAIL_DOMAIN = 'guest.soulsync.local';
const PROFILE_STUB_DOB = new Date('1990-01-01T00:00:00.000Z');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly passwordService: PasswordService,
    private readonly loginCodeService: LoginCodeService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly mediaService: MediaService,
    private readonly activityLog: ActivityLogRecorder,
    private readonly authSession: AuthSessionService,
  ) {}

  private toPublicUser(
    user: User,
    hasPassword = false,
    loginCode: string | null = null,
  ): PublicUser {
    const placeholder = isGuestPlaceholderEmail(user.email);
    const hasVerifiedEmail = !!user.emailVerifiedAt && !placeholder;
    return {
      id: user.id,
      email: placeholder ? null : user.email,
      hasVerifiedEmail,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      isGuest: user.isGuest,
      role: user.role,
      status: user.status,
      hasPassword,
      avatarUrl: user.avatarUrl ?? null,
      loginCode,
    };
  }

  async publicUserForId(userId: string): Promise<PublicUser> {
    const user = await this.prisma.client.user.findUniqueOrThrow({ where: { id: userId } });
    return this.toPublicUserWithPassword(user);
  }

  private async userHasPassword(userId: string): Promise<boolean> {
    const credential = await this.prisma.client.userCredential.findUnique({
      where: { userId },
      select: { userId: true },
    });
    return !!credential;
  }

  private async toPublicUserWithPassword(user: User): Promise<PublicUser> {
    const hasPassword = await this.userHasPassword(user.id);
    const plain = this.loginCodeService.decryptStoredLoginCode(user.loginCodeEnc);
    const loginCode = plain ? formatLoginCode(plain) : null;
    return this.toPublicUser(user, hasPassword, loginCode);
  }

  private async ensureLoginCodeEnc(
    userId: string,
    normalizedCode: string,
    existingEnc: string | null | undefined,
  ): Promise<void> {
    if (existingEnc) {
      return;
    }
    await this.prisma.client.user.update({
      where: { id: userId },
      data: {
        loginCodeEnc: this.loginCodeService.encryptPlainLoginCode(normalizedCode),
      },
    });
  }

  /**
   * Every account must have a retrievable login code for profile display.
   * Legacy rows may have hash/fingerprint only (no enc); issue a new stored code once.
   */
  private async ensureRetrievableLoginCode(user: User): Promise<User> {
    if (user.loginCodeEnc) {
      return user;
    }

    const loginCodePlain = await this.loginCodeService.generateUniqueCode();
    const normalizedCode = normalizeLoginCode(loginCodePlain);
    const loginCodeFingerprint = this.loginCodeService.fingerprint(normalizedCode);
    const loginCodeHash = await this.loginCodeService.hashCode(normalizedCode);
    const loginCodeEnc = this.loginCodeService.encryptPlainLoginCode(normalizedCode);

    const data: {
      loginCodeFingerprint: string;
      loginCodeHash: string;
      loginCodeEnc: string;
      email?: string;
      lastName?: string;
      firstName?: string;
    } = {
      loginCodeFingerprint,
      loginCodeHash,
      loginCodeEnc,
    };

    if (user.isGuest) {
      data.email = `guest+${loginCodeFingerprint.slice(0, 24)}@${GUEST_EMAIL_DOMAIN}`;
      data.firstName = 'Guest';
      data.lastName = guestLastNameFromLoginCode(normalizedCode);
    }

    const updated = await this.prisma.client.user.update({
      where: { id: user.id },
      data,
    });

    if (user.isGuest) {
      const displayName = guestDisplayNameFromLoginCode(normalizedCode);
      await this.prisma.client.profile.updateMany({
        where: { userId: user.id },
        data: { displayName },
      });
    }

    return updated;
  }

  private buildDisplayName(firstName: string, lastName: string): string {
    return [firstName, lastName].filter(Boolean).join(' ').trim();
  }

  async resolveDefaultTenantId(): Promise<string> {
    const slug = this.config.get('DEFAULT_AUTH_TENANT_SLUG', { infer: true });
    const tenant = await this.prisma.client.tenant.findFirst({
      where: { slug, isActive: true },
      select: { id: true },
    });
    if (!tenant) {
      throw new BadRequestException(`Default tenant "${slug}" is not available`);
    }
    return tenant.id;
  }

  private buildJwtPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    };
  }

  private async issueAuthResult(
    user: User,
    ctx?: ActivityLogRequestContext,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authSession.createSession(
      { id: user.id, tenantId: user.tenantId, role: user.role },
      ctx,
    );
  }

  async refreshSession(
    refreshToken: string,
    ctx?: ActivityLogRequestContext,
  ): Promise<AuthResult> {
    try {
      const rotated = await this.authSession.rotateSession(refreshToken, ctx);
      const user = await this.prisma.client.user.findUnique({
        where: { id: rotated.userId },
      });
      if (!user || user.deletedAt || user.status === UserStatus.DELETED) {
        this.activityLog.authRefreshFailed(rotated.tenantId, ctx);
        throw new UnauthorizedException('User not found or inactive');
      }
      this.activityLog.authRefreshSuccess(
        {
          id: user.id,
          tenantId: user.tenantId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        ctx,
      );
      return {
        accessToken: rotated.accessToken,
        refreshToken: rotated.refreshToken,
        user: await this.toPublicUserWithPassword(user),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        try {
          const tenantId = await this.resolveDefaultTenantId();
          this.activityLog.authRefreshFailed(tenantId, ctx);
        } catch {
          /* skip audit if tenant cannot be resolved */
        }
      }
      throw error;
    }
  }

  async logoutSession(
    userId: string,
    input: { sessionId?: string; refreshToken?: string },
    ctx?: ActivityLogRequestContext,
  ): Promise<void> {
    let revoked = false;
    if (input.sessionId) {
      revoked = await this.authSession.revokeSession(input.sessionId, userId);
    } else if (input.refreshToken) {
      revoked = await this.authSession.revokeByRefreshToken(input.refreshToken);
    }
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true, username: true, firstName: true, lastName: true },
    });
    if (user && revoked) {
      this.activityLog.authLogout(user, ctx);
    }
  }

  private async createProfileStub(params: {
    userId: string;
    tenantId: string;
    displayName: string;
  }): Promise<void> {
    await this.prisma.client.profile.create({
      data: {
        userId: params.userId,
        tenantId: params.tenantId,
        displayName: params.displayName,
        gender: Gender.MALE,
        dateOfBirth: PROFILE_STUB_DOB,
        country: 'Unknown',
        city: 'Unknown',
        religion: Religion.ISLAM,
        isDiscoverable: false,
        completenessScore: 0,
      },
    });
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const tenantId = await this.resolveDefaultTenantId();
    const email = dto.email.trim().toLowerCase();
    const username = normalizeUsername(dto.username);

    const existing = await this.prisma.client.user.findFirst({
      where: {
        tenantId,
        OR: [{ email }, { username }],
      },
      select: { email: true, username: true },
    });

    if (existing?.email === email) {
      throw new ConflictException('Email is already registered');
    }
    if (existing?.username === username) {
      throw new ConflictException('Username is already taken');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const loginCodePlain = await this.loginCodeService.generateUniqueCode();
    const normalizedCode = normalizeLoginCode(loginCodePlain);
    const loginCodeFingerprint = this.loginCodeService.fingerprint(normalizedCode);
    const loginCodeHash = await this.loginCodeService.hashCode(normalizedCode);

    const user = await this.prisma.client.user.create({
      data: {
        tenantId,
        email,
        username,
        isGuest: false,
        status: UserStatus.ACTIVE,
        loginCodeFingerprint,
        loginCodeHash,
        loginCodeEnc: this.loginCodeService.encryptPlainLoginCode(normalizedCode),
        credential: {
          create: { passwordHash },
        },
        twoFactor: {
          create: { isEnabled: false },
        },
        passwordHistory: {
          create: {
            passwordHash,
            source: PasswordChangeSource.INITIAL,
          },
        },
      },
    });

    await this.createProfileStub({
      userId: user.id,
      tenantId,
      displayName: username,
    });

    const tokens = await this.issueAuthResult(user);
    this.activityLog.authRegistered(user);
    return {
      ...tokens,
      user: this.toPublicUser(user, true),
      loginCodePlain,
    };
  }

  async login(dto: LoginDto, ctx?: ActivityLogRequestContext): Promise<AuthResult> {
    const tenantId = await this.resolveDefaultTenantId();
    const identifier = dto.identifier.trim();
    const normalizedCode = normalizeLoginCode(identifier);

    const user = await (async (): Promise<User | null> => {
      if (identifier.includes('@')) {
        return this.prisma.client.user.findUnique({
          where: { tenantId_email: { tenantId, email: identifier.toLowerCase() } },
        });
      }
      if (isCompleteLoginCode(identifier)) {
        const fp = this.loginCodeService.fingerprint(normalizedCode);
        return this.prisma.client.user.findUnique({
          where: { loginCodeFingerprint: fp },
        });
      }
      return this.prisma.client.user.findFirst({
        where: { tenantId, username: identifier.toLowerCase() },
      });
    })();

    if (!user || user.deletedAt || user.status === UserStatus.DELETED) {
      this.activityLog.authLoginFailed(tenantId, ctx);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (isCompleteLoginCode(identifier)) {
      await this.ensureLoginCodeEnc(user.id, normalizedCode, user.loginCodeEnc);
    }

    const credential = await this.prisma.client.userCredential.findUnique({
      where: { userId: user.id },
    });

    if (!credential) {
      this.activityLog.authLoginFailed(tenantId, ctx);
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordOk = await this.passwordService.compare(dto.password, credential.passwordHash);
    if (!passwordOk) {
      this.activityLog.authLoginFailed(tenantId, ctx);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const sessionUser =
      isCompleteLoginCode(identifier) && !user.loginCodeEnc
        ? await this.prisma.client.user.findUniqueOrThrow({ where: { id: user.id } })
        : user;

    const tokens = await this.issueAuthResult(sessionUser, ctx);
    this.activityLog.authLoginSuccess(
      {
        id: sessionUser.id,
        tenantId: sessionUser.tenantId,
        username: sessionUser.username,
        firstName: sessionUser.firstName,
        lastName: sessionUser.lastName,
      },
      ctx,
    );
    return { ...tokens, user: await this.toPublicUserWithPassword(sessionUser) };
  }

  async createGuest(): Promise<AuthResult> {
    const tenantId = await this.resolveDefaultTenantId();
    const loginCodePlain = await this.loginCodeService.generateUniqueCode();
    const normalizedCode = normalizeLoginCode(loginCodePlain);
    const loginCodeFingerprint = this.loginCodeService.fingerprint(normalizedCode);
    const loginCodeHash = await this.loginCodeService.hashCode(normalizedCode);
    const lastName = guestLastNameFromLoginCode(normalizedCode);
    const displayName = guestDisplayNameFromLoginCode(normalizedCode);
    const email = `guest+${loginCodeFingerprint.slice(0, 24)}@${GUEST_EMAIL_DOMAIN}`;

    const user = await this.prisma.client.user.create({
      data: {
        tenantId,
        email,
        username: null,
        firstName: 'Guest',
        lastName,
        isGuest: true,
        status: UserStatus.ACTIVE,
        loginCodeFingerprint,
        loginCodeHash,
        loginCodeEnc: this.loginCodeService.encryptPlainLoginCode(normalizedCode),
        twoFactor: {
          create: { isEnabled: false },
        },
      },
    });

    await this.createProfileStub({
      userId: user.id,
      tenantId,
      displayName,
    });

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueAuthResult(user);
    this.activityLog.authGuestCreated(user);
    return {
      ...tokens,
      user: await this.toPublicUserWithPassword(user),
      loginCodePlain,
    };
  }

  async guestLogin(dto: GuestLoginDto, ctx?: ActivityLogRequestContext): Promise<AuthResult> {
    const normalizedCode = this.loginCodeService.normalize(dto.loginCode);
    if (!isCompleteLoginCode(normalizedCode)) {
      throw new BadRequestException('Enter a complete 16-digit login code');
    }

    const fp = this.loginCodeService.fingerprint(normalizedCode);
    const user = await this.prisma.client.user.findUnique({
      where: { loginCodeFingerprint: fp },
    });

    if (!user || user.deletedAt || user.status === UserStatus.DELETED || !user.isGuest) {
      throw new UnauthorizedException('Invalid guest login code');
    }

    await this.ensureLoginCodeEnc(user.id, normalizedCode, user.loginCodeEnc);

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const refreshed = await this.prisma.client.user.findUniqueOrThrow({ where: { id: user.id } });
    const tokens = await this.issueAuthResult(refreshed, ctx);
    this.activityLog.authGuestLogin(refreshed, ctx);
    return { ...tokens, user: await this.toPublicUserWithPassword(refreshed) };
  }

  async checkUsernameAvailable(
    rawUsername: string,
    excludeUserId?: string,
  ): Promise<{
    username: string;
    available: boolean;
    valid: boolean;
  }> {
    const username = normalizeUsername(rawUsername);
    const validation = validateUsername(username);
    if (!validation.valid) {
      return { username, available: false, valid: false };
    }

    const tenantId = await this.resolveDefaultTenantId();

    if (excludeUserId) {
      const current = await this.prisma.client.user.findFirst({
        where: { id: excludeUserId, tenantId },
        select: { username: true },
      });
      if (current?.username === username) {
        return { username, available: true, valid: true };
      }
    }

    const existing = await this.prisma.client.user.findFirst({
      where: { tenantId, username },
      select: { id: true },
    });

    return {
      username,
      available: !existing || existing.id === excludeUserId,
      valid: true,
    };
  }

  async getMe(userId: string): Promise<PublicUser> {
    const user = await this.prisma.client.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt || user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('User not found');
    }
    const withCode = await this.ensureRetrievableLoginCode(user);
    return this.toPublicUserWithPassword(withCode);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<PublicUser> {
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    if (!firstName && !lastName) {
      throw new BadRequestException('Enter at least a first or last name');
    }

    const user = await this.prisma.client.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt || user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('User not found');
    }

    const displayName = this.buildDisplayName(firstName, lastName);

    await this.prisma.client.$transaction([
      this.prisma.client.user.update({
        where: { id: userId },
        data: { firstName: firstName || null, lastName: lastName || null },
      }),
      this.prisma.client.profile.updateMany({
        where: { userId },
        data: { displayName: displayName || user.username || 'Member' },
      }),
    ]);

    const updated = await this.prisma.client.user.findUniqueOrThrow({ where: { id: userId } });
    const fieldNames: string[] = [];
    if (firstName !== (user.firstName ?? '')) {
      fieldNames.push('firstName');
    }
    if (lastName !== (user.lastName ?? '')) {
      fieldNames.push('lastName');
    }
    this.activityLog.profileUpdated(
      {
        id: updated.id,
        tenantId: updated.tenantId,
        username: updated.username,
        firstName: updated.firstName,
        lastName: updated.lastName,
        profile: { displayName: displayName || updated.username || 'Member' },
      },
      fieldNames.length ? fieldNames : undefined,
    );
    return this.toPublicUserWithPassword(updated);
  }

  async updateUsername(userId: string, dto: UpdateUsernameDto): Promise<PublicUser> {
    const username = normalizeUsername(dto.username);
    const availability = await this.checkUsernameAvailable(username, userId);
    if (!availability.valid) {
      throw new BadRequestException('Username is not valid');
    }
    if (!availability.available) {
      throw new ConflictException('Username is already taken');
    }

    const updated = await this.prisma.client.user.update({
      where: { id: userId },
      data: { username },
    });
    this.activityLog.usernameUpdated({
      id: updated.id,
      tenantId: updated.tenantId,
      username: updated.username,
    });
    return this.toPublicUserWithPassword(updated);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<PublicUser> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prisma.client.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt || user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('User not found');
    }

    const credential = await this.prisma.client.userCredential.findUnique({
      where: { userId },
    });

    const passwordHash = await this.passwordService.hash(dto.newPassword);

    if (!credential) {
      await this.prisma.client.$transaction([
        this.prisma.client.userCredential.create({
          data: { userId, passwordHash },
        }),
        this.prisma.client.passwordHistory.create({
          data: {
            userId,
            passwordHash,
            source: PasswordChangeSource.INITIAL,
          },
        }),
      ]);
      const updated = await this.prisma.client.user.findUniqueOrThrow({ where: { id: userId } });
      return this.toPublicUser(updated, true);
    }

    const currentPassword = dto.currentPassword?.trim();
    if (!currentPassword) {
      throw new BadRequestException('Current password is required');
    }

    const currentOk = await this.passwordService.compare(currentPassword, credential.passwordHash);
    if (!currentOk) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const sameAsCurrent = await this.passwordService.compare(
      dto.newPassword,
      credential.passwordHash,
    );
    if (sameAsCurrent) {
      throw new BadRequestException('Choose a password different from your current one');
    }

    await this.prisma.client.$transaction([
      this.prisma.client.userCredential.update({
        where: { userId },
        data: { passwordHash, passwordChangedAt: new Date() },
      }),
      this.prisma.client.passwordHistory.create({
        data: {
          userId,
          passwordHash,
          source: PasswordChangeSource.USER_CHANGE,
        },
      }),
    ]);

    const updated = await this.prisma.client.user.findUniqueOrThrow({ where: { id: userId } });
    return this.toPublicUser(updated, true);
  }

  async uploadAvatar(userId: string, file: UploadedFilePayload): Promise<PublicUser> {
    this.mediaService.assertImageMime(file);

    const user = await this.prisma.client.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, tenantId: true, avatarPublicId: true },
    });

    const uploaded = await this.mediaService.uploadUserFile(file, user.tenantId, user.id, 'avatar');

    return this.saveAvatarUpload(userId, user.avatarPublicId, uploaded);
  }

  async uploadAvatarFromUrl(userId: string, url: string): Promise<PublicUser> {
    const user = await this.prisma.client.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, tenantId: true, avatarPublicId: true },
    });

    const uploaded = await this.mediaService.uploadFromRemoteUrl(
      url,
      user.tenantId,
      user.id,
      'avatar',
    );

    return this.saveAvatarUpload(userId, user.avatarPublicId, uploaded);
  }

  private async saveAvatarUpload(
    userId: string,
    previousPublicId: string | null,
    uploaded: UploadResult,
  ): Promise<PublicUser> {
    if (previousPublicId) {
      await this.mediaService.destroyPublicId(previousPublicId, 'image');
    }

    const updated = await this.prisma.client.user.update({
      where: { id: userId },
      data: {
        avatarUrl: uploaded.url,
        avatarPublicId: uploaded.publicId,
      },
    });

    return this.toPublicUserWithPassword(updated);
  }
}
