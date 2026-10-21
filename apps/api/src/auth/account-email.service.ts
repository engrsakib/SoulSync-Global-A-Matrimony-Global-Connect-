import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { isGuestPlaceholderEmail, normalizeEmail } from '@soulsync/shared-types';
import type { User } from '@soulsync/db';
import { EmailVerificationService } from '../email-verification/email-verification.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import type { PublicUser } from './auth.types';

@Injectable()
export class AccountEmailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly emailVerification: EmailVerificationService,
    private readonly authService: AuthService,
  ) {}

  private async getUserOrThrow(userId: string): Promise<User> {
    const user = await this.prisma.client.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new ForbiddenException('Account not found');
    }
    return user;
  }

  private assertCanSetEmail(user: User): void {
    if (user.emailVerifiedAt && !isGuestPlaceholderEmail(user.email)) {
      throw new BadRequestException('Email is already verified. Use change email instead.');
    }
  }

  private assertCanChangeEmail(user: User): void {
    if (!user.emailVerifiedAt || isGuestPlaceholderEmail(user.email)) {
      throw new ForbiddenException('Add and verify an email before changing it.');
    }
  }

  private async assertEmailAvailable(
    tenantId: string,
    email: string,
    excludeUserId: string,
  ): Promise<void> {
    const existing = await this.prisma.client.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
      select: { id: true },
    });
    if (existing && existing.id !== excludeUserId) {
      throw new ConflictException('Email is already in use');
    }
  }

  async requestSetEmail(userId: string, rawEmail: string): Promise<{ message: string }> {
    const user = await this.getUserOrThrow(userId);
    this.assertCanSetEmail(user);
    const email = normalizeEmail(rawEmail);
    await this.assertEmailAvailable(user.tenantId, email, user.id);

    const code = this.emailVerification.generateCode();
    await this.emailVerification.storeOtp('set', user.id, code, email);
    await this.mail.sendVerificationCode(email, code, 'confirm your email address');

    return { message: 'Verification code sent' };
  }

  async confirmSetEmail(userId: string, rawEmail: string, code: string): Promise<PublicUser> {
    const user = await this.getUserOrThrow(userId);
    this.assertCanSetEmail(user);
    const email = normalizeEmail(rawEmail);
    await this.assertEmailAvailable(user.tenantId, email, user.id);
    await this.emailVerification.verifyOtp('set', user.id, code, email);

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { email, emailVerifiedAt: new Date(), isGuest: false },
    });

    return this.authService.publicUserForId(user.id);
  }

  async requestChangeCurrentEmail(userId: string): Promise<{ message: string }> {
    const user = await this.getUserOrThrow(userId);
    this.assertCanChangeEmail(user);

    const code = this.emailVerification.generateCode();
    await this.emailVerification.storeOtp('change-current', user.id, code);
    await this.mail.sendVerificationCode(
      user.email,
      code,
      'confirm you want to change your email address',
    );

    return { message: 'Verification code sent to your current email' };
  }

  async verifyChangeCurrentEmail(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.getUserOrThrow(userId);
    this.assertCanChangeEmail(user);
    await this.emailVerification.verifyOtp('change-current', user.id, code);
    await this.emailVerification.markChangeCurrentVerified(user.id);
    return { message: 'Current email verified' };
  }

  async requestChangeNewEmail(userId: string, rawEmail: string): Promise<{ message: string }> {
    const user = await this.getUserOrThrow(userId);
    this.assertCanChangeEmail(user);
    await this.emailVerification.assertChangeCurrentVerified(user.id);

    const email = normalizeEmail(rawEmail);
    if (email === normalizeEmail(user.email)) {
      throw new BadRequestException('New email must be different from your current email');
    }
    await this.assertEmailAvailable(user.tenantId, email, user.id);

    const code = this.emailVerification.generateCode();
    await this.emailVerification.storeOtp('change-new', user.id, code, email);
    await this.mail.sendVerificationCode(email, code, 'confirm your new email address');

    return { message: 'Verification code sent to your new email' };
  }

  async confirmChangeNewEmail(userId: string, rawEmail: string, code: string): Promise<PublicUser> {
    const user = await this.getUserOrThrow(userId);
    this.assertCanChangeEmail(user);
    await this.emailVerification.assertChangeCurrentVerified(user.id);

    const email = normalizeEmail(rawEmail);
    await this.assertEmailAvailable(user.tenantId, email, user.id);
    await this.emailVerification.verifyOtp('change-new', user.id, code, email);

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { email, emailVerifiedAt: new Date(), isGuest: false },
    });
    await this.emailVerification.clearChangeCurrentVerified(user.id);

    return this.authService.publicUserForId(user.id);
  }
}
