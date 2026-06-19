import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  async sendConfirmationEmail(
    user: { email: string; firstName: string },
    token: string,
  ) {
    const appUrl = this.config.get<string>('APP_URL');
    const confirmUrl = `${appUrl}/api/v1/auth/verify-email?token=${token}`;

    await this.mailer.sendMail({
      to: user.email,
      subject: 'Confirm your Movelo account',
      template: './confirmation',
      context: {
        name: user.firstName,
        confirmUrl,
      },
    });
  }
}
