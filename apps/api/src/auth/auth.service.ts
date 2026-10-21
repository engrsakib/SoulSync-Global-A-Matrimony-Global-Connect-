import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Gender, PasswordChangeSource, Religion, UserStatus, type User } from '@soulsync/db';
import {
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
  ) {}

  private toPublicUser(user: User, hasPassword = false): PublicUser {
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
    return this.toPublicUser(user, hasPassword);
  }

  private buildDisplayName(firstName: string, lastName: string): string {
    return [firstName, lastName].filter(Boolean).join(' ').trim();
  }

  private async resolveDefaultTenantId(): Promise<string> {
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

  private signToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    };
    return this.jwtTokenService.sign(payload);
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
        religion: Religion.PREFER_NOT_TO_SAY,
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

    const accessToken = this.signToken(user);
    return {
      accessToken,
      user: this.toPublicUser(user, true),
      loginCodePlain,
    };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
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
      throw new UnauthorizedException('Invalid credentials');
    }

    const credential = await this.prisma.client.userCredential.findUnique({
      where: { userId: user.id },
    });

    if (!credential) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordOk = await this.passwordService.compare(dto.password, credential.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = this.signToken(user);
    return { accessToken, user: await this.toPublicUserWithPassword(user) };
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

    const accessToken = this.signToken(user);
    return {
      accessToken,
      user: this.toPublicUser(user, false),
      loginCodePlain,
    };
  }

  async guestLogin(dto: GuestLoginDto): Promise<AuthResult> {
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

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = this.signToken(user);
    return { accessToken, user: await this.toPublicUserWithPassword(user) };
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
    return this.toPublicUserWithPassword(user);
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
}
