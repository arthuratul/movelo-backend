import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SignupDto } from './dto/signup.dto';
import { AuthorizeDto } from './dto/authorize.dto';
import { TokenDto } from './dto/token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationTokenExpiry = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
        emailVerificationToken,
        emailVerificationTokenExpiry,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    await this.mail.sendConfirmationEmail(
      { email: dto.email, firstName: dto.firstName },
      emailVerificationToken,
    );

    return user;
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerified) {
      return;
    }

    if (
      user.emailVerificationTokenExpiry &&
      user.emailVerificationTokenExpiry < new Date()
    ) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
      },
    });
  }

  async authorize(dto: AuthorizeDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException('Email address is not verified');
    }

    const code = crypto.randomBytes(32).toString('hex');
    const authCodeTtlMs = this.config.get<number>('AUTH_CODE_TTL_SECONDS')! * 1000;
    const expiresAt = new Date(Date.now() + authCodeTtlMs);

    await this.prisma.authorizationCode.create({
      data: {
        code,
        userId: user.id,
        codeChallenge: dto.code_challenge,
        codeChallengeMethod: dto.code_challenge_method,
        expiresAt,
      },
    });

    return { code };
  }

  async exchangeToken(dto: TokenDto) {
    if (dto.grant_type === 'authorization_code') {
      return this.exchangeAuthCode(dto);
    }
    return this.exchangeRefreshToken(dto);
  }

  private async exchangeAuthCode(dto: TokenDto) {
    if (!dto.code || !dto.code_verifier) {
      throw new BadRequestException('code and code_verifier are required');
    }

    const authCode = await this.prisma.authorizationCode.findUnique({
      where: { code: dto.code },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!authCode) {
      throw new UnauthorizedException('Invalid authorization code');
    }

    if (authCode.used) {
      // Code reuse — potential replay attack, revoke all tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId: authCode.userId },
        data: { revoked: true },
      });
      throw new UnauthorizedException('Authorization code already used');
    }

    if (authCode.expiresAt < new Date()) {
      throw new UnauthorizedException('Authorization code has expired');
    }

    if (!this.verifyCodeChallenge(dto.code_verifier, authCode.codeChallenge)) {
      throw new UnauthorizedException('Invalid code verifier');
    }

    await this.prisma.authorizationCode.update({
      where: { id: authCode.id },
      data: { used: true },
    });

    return this.issueTokens(authCode.user.id, authCode.user.email);
  }

  private async exchangeRefreshToken(dto: TokenDto) {
    if (!dto.refresh_token) {
      throw new BadRequestException('refresh_token is required');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refresh_token },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!stored || stored.revoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Rotate: revoke old token before issuing new one
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    return this.issueTokens(stored.user.id, stored.user.email);
  }

  async logout(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored || stored.revoked) {
      return;
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });
  }

  private async issueTokens(userId: string, email: string) {
    const accessToken = this.jwt.sign({ sub: userId, email });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTtlMs = this.config.get<number>('REFRESH_TOKEN_TTL_SECONDS')! * 1000;
    const expiresAt = new Date(Date.now() + refreshTtlMs);

    await this.prisma.refreshToken.create({
      data: { token: rawRefreshToken, userId, expiresAt },
    });

    return {
      access_token: accessToken,
      refresh_token: rawRefreshToken,
      token_type: 'Bearer',
      expires_in: this.config.get<number>('JWT_ACCESS_EXPIRES_IN')!,
    };
  }

  private verifyCodeChallenge(verifier: string, challenge: string): boolean {
    const computed = crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64')
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '');
    return computed === challenge;
  }
}
