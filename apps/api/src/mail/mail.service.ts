import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { Env } from '../config/env.schema';
import {
  buildVerificationEmailHtml,
  buildVerificationEmailText,
  type VerificationEmailContext,
} from './verification-email.template';

@Injectable()
export class MailService {
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService<Env, true>) {}

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.config.get('SMTP_HOST', { infer: true });
    const user = this.config.get('SMTP_USER', { infer: true });
    const pass = this.config.get('SMTP_PASS', { infer: true });

    if (!host || !user || !pass) {
      throw new ServiceUnavailableException(
        'Email is not configured on the server. Please try again later.',
      );
    }

    const port = this.config.get('SMTP_PORT', { infer: true }) ?? 587;
    const secure = this.config.get('SMTP_SECURE', { infer: true }) ?? false;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    return this.transporter;
  }

  async sendVerificationCode(to: string, code: string, purposeLabel: string): Promise<void> {
    const appName = this.config.get('APP_PUBLIC_NAME', { infer: true });
    const from =
      this.config.get('SMTP_FROM', { infer: true }) ??
      this.config.get('SMTP_USER', { infer: true });

    const context: VerificationEmailContext = { appName, code, purposeLabel };

    try {
      await this.getTransporter().sendMail({
        from,
        to,
        subject: `${appName} verification code`,
        text: buildVerificationEmailText(context),
        html: buildVerificationEmailHtml(context),
      });
    } catch {
      throw new ServiceUnavailableException('Could not send email. Please try again later.');
    }
  }
}
