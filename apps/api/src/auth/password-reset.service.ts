import { BadRequestException, Injectable } from '@nestjs/common';
import { PasswordChangeSource, UserStatus } from '@soulsync/db';
import { isGuestPlaceholderEmail, normalizeEmail } from '@soulsync/shared-types';
import { EmailVerificationService } from '../email-verification/email-verification.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

const GENERIC_REQUEST_MESSAGE =
  'If an account with that email exists, we sent a verification code.';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly emailVerification: EmailVerificationService,
    private readonly mail: MailService,
    private readonly passwordService: PasswordService,
  ) {}

  async requestReset(rawEmail: string): Promise<{ message: string }> {
    const email = normalizeEmail(rawEmail);
    const tenantId = await this.authService.resolveDefaultTenantId();

    const user = await this.prisma.client.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
      select: { id: true, deletedAt: true, status: true, email: true },
    });

    const eligible =
      user &&
      !user.deletedAt &&
      user.status !== UserStatus.DELETED &&
      !isGuestPlaceholderEmail(user.email);

    if (eligible) {
      const credential = await this.prisma.client.userCredential.findUnique({
        where: { userId: user.id },
        select: { userId: true },
      });
      if (credential) {
        const code = this.emailVerification.generateCode();
        await this.emailVerification.storePasswordResetOtp(tenantId, email, code);
        await this.mail.sendVerificationCode(email, code, 'reset your password');
      }
    }

    return { message: GENERIC_REQUEST_MESSAGE };
  }

  async verifyCode(rawEmail: string, code: string): Promise<{ message: string }> {
    const email = normalizeEmail(rawEmail);
    const tenantId = await this.authService.resolveDefaultTenantId();
    await this.assertEligibleAccount(tenantId, email);
    await this.emailVerification.verifyPasswordResetOtp(tenantId, email, code);
    await this.emailVerification.markPasswordResetVerified(tenantId, email);
    return { message: 'Code verified. You can set a new password.' };
  }

  async confirmReset(
    rawEmail: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ message: string }> {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const email = normalizeEmail(rawEmail);
    const tenantId = await this.authService.resolveDefaultTenantId();
    const user = await this.assertEligibleAccount(tenantId, email);
    await this.emailVerification.assertPasswordResetVerified(tenantId, email);

    const credential = await this.prisma.client.userCredential.findUnique({
      where: { userId: user.id },
    });
    if (!credential) {
      throw new BadRequestException('This account cannot reset a password here.');
    }

    const sameAsCurrent = await this.passwordService.compare(newPassword, credential.passwordHash);
    if (sameAsCurrent) {
      throw new BadRequestException('Choose a password different from your current one');
    }

    const passwordHash = await this.passwordService.hash(newPassword);

    await this.prisma.client.$transaction([
      this.prisma.client.userCredential.update({
        where: { userId: user.id },
        data: { passwordHash, passwordChangedAt: new Date() },
      }),
      this.prisma.client.passwordHistory.create({
        data: {
          userId: user.id,
          passwordHash,
          source: PasswordChangeSource.USER_CHANGE,
        },
      }),
    ]);

    await this.emailVerification.clearPasswordResetVerified(tenantId, email);

    return { message: 'Password updated. You can log in with your new password.' };
  }

  private async assertEligibleAccount(tenantId: string, email: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });
    if (
      !user ||
      user.deletedAt ||
      user.status === UserStatus.DELETED ||
      isGuestPlaceholderEmail(user.email)
    ) {
      throw new BadRequestException('Verification code expired or invalid. Request a new code.');
    }
    const credential = await this.prisma.client.userCredential.findUnique({
      where: { userId: user.id },
    });
    if (!credential) {
      throw new BadRequestException('Verification code expired or invalid. Request a new code.');
    }
    return user;
  }
}
