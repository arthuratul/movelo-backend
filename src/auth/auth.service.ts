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
import { OAuthClientService } from './services/oauth-client.service';
import { SignupDto } from './dto/signup.dto';
import { AuthorizeQueryDto } from './dto/authorize-query.dto';
import { TokenDto } from './dto/token.dto';

interface AuthCodeParams {
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: 'S256';
  state?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly oauthClientService: OAuthClientService,
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

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<{ userId: string; email: string } | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (
      !user ||
      !user.password ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return null;
    }

    if (!user.emailVerified) {
      throw new ForbiddenException('Email address is not verified');
    }

    return { userId: user.id, email: user.email };
  }

  async initiateAuthorization(dto: AuthorizeQueryDto): Promise<string> {
    const client = await this.oauthClientService.findById(dto.client_id);

    if (!client) {
      throw new BadRequestException('Unknown client_id');
    }

    if (!client.redirectUris.includes(dto.redirect_uri)) {
      throw new BadRequestException(
        'redirect_uri is not registered for this client',
      );
    }

    const appUrl = this.config.getOrThrow<string>('APP_URL');
    const params = new URLSearchParams({
      client_id: dto.client_id,
      redirect_uri: dto.redirect_uri,
      code_challenge: dto.code_challenge,
      code_challenge_method: dto.code_challenge_method,
      ...(dto.state ? { state: dto.state } : {}),
    });

    return `${appUrl}/auth/login?${params.toString()}`;
  }

  async getLoginPageData(query: {
    client_id: string;
    redirect_uri: string;
  }): Promise<{ clientName: string } | null> {
    const client = await this.oauthClientService.findById(query.client_id);

    if (!client || !client.redirectUris.includes(query.redirect_uri)) {
      return null;
    }

    return { clientName: client.name };
  }

  async processLogin(body: {
    email: string;
    password: string;
    client_id: string;
    redirect_uri: string;
    code_challenge: string;
    code_challenge_method: string;
    state?: string;
  }): Promise<string> {
    // validateCredentials returns null for wrong credentials,
    // throws ForbiddenException if email is not verified
    const user = await this.validateCredentials(body.email, body.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // createAuthCode re-validates client + redirect_uri before writing the code
    const { redirect_to } = await this.createAuthCode(
      user.userId,
      body.client_id,
      {
        redirect_uri: body.redirect_uri,
        code_challenge: body.code_challenge,
        code_challenge_method: body.code_challenge_method as 'S256',
        state: body.state,
      },
    );

    return redirect_to;
  }

  async createAuthCode(userId: string, clientId: string, dto: AuthCodeParams) {
    const client = await this.oauthClientService.findById(clientId);

    if (!client || !client.redirectUris.includes(dto.redirect_uri)) {
      throw new BadRequestException(
        'redirect_uri is not registered for this client',
      );
    }

    const code = crypto.randomBytes(32).toString('hex');
    const authCodeTtlMs =
      this.config.get<number>('AUTH_CODE_TTL_SECONDS')! * 1000;
    const expiresAt = new Date(Date.now() + authCodeTtlMs);

    await this.prisma.authorizationCode.create({
      data: {
        code,
        userId,
        clientId,
        codeChallenge: dto.code_challenge,
        codeChallengeMethod: dto.code_challenge_method,
        redirectUri: dto.redirect_uri,
        state: dto.state,
        expiresAt,
      },
    });

    const redirectParams = new URLSearchParams({ code });
    if (dto.state) redirectParams.set('state', dto.state);

    return { redirect_to: `${dto.redirect_uri}?${redirectParams.toString()}` };
  }

  async validateRefreshToken(
    token: string,
    clientId: string,
  ): Promise<{ id: string; userId: string; userEmail: string } | null> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true } } },
    });

    if (
      !stored ||
      stored.revoked ||
      stored.expiresAt < new Date() ||
      stored.clientId !== clientId
    ) {
      return null;
    }

    return {
      id: stored.id,
      userId: stored.userId,
      userEmail: stored.user.email,
    };
  }

  async rotateRefreshToken(
    storedTokenId: string,
    userId: string,
    email: string,
    clientId: string,
  ) {
    await this.prisma.refreshToken.update({
      where: { id: storedTokenId },
      data: { revoked: true },
    });

    return this.issueTokens(userId, email, clientId);
  }

  async exchangeToken(dto: TokenDto, clientId: string) {
    const authCode = await this.prisma.authorizationCode.findUnique({
      where: { code: dto.code },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!authCode) {
      throw new UnauthorizedException('Invalid authorization code');
    }

    if (authCode.clientId !== clientId) {
      throw new UnauthorizedException(
        'Authorization code was not issued to this client',
      );
    }

    if (authCode.used) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: authCode.userId, clientId },
        data: { revoked: true },
      });
      throw new UnauthorizedException('Authorization code already used');
    }

    if (authCode.expiresAt < new Date()) {
      throw new UnauthorizedException('Authorization code has expired');
    }

    if (authCode.redirectUri !== dto.redirect_uri) {
      throw new UnauthorizedException('redirect_uri does not match');
    }

    if (
      !this.verifyCodeChallenge(
        dto.code_verifier,
        authCode.codeChallenge,
        authCode.codeChallengeMethod,
      )
    ) {
      throw new UnauthorizedException('Invalid code verifier');
    }

    await this.prisma.authorizationCode.update({
      where: { id: authCode.id },
      data: { used: true },
    });

    return this.issueTokens(authCode.user.id, authCode.user.email, clientId);
  }

  async findOrCreateGoogleUser(profile: {
    sub: string;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
  }) {
    const existing = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: profile.sub,
        },
      },
      include: { user: true },
    });

    if (existing) return existing.user;

    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          password: null,
          emailVerified: profile.emailVerified,
        },
      });
    }

    await this.prisma.oAuthAccount.create({
      data: {
        userId: user.id,
        provider: 'google',
        providerAccountId: profile.sub,
      },
    });

    return user;
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

  private async issueTokens(userId: string, email: string, clientId: string) {
    const accessToken = this.jwt.sign({ sub: userId, email, clientId });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTtlMs =
      this.config.get<number>('REFRESH_TOKEN_TTL_SECONDS')! * 1000;
    const expiresAt = new Date(Date.now() + refreshTtlMs);

    await this.prisma.refreshToken.create({
      data: { token: rawRefreshToken, userId, clientId, expiresAt },
    });

    return {
      access_token: accessToken,
      refresh_token: rawRefreshToken,
      token_type: 'Bearer',
      expires_in: this.config.get<number>('JWT_ACCESS_EXPIRES_IN')!,
    };
  }

  private verifyCodeChallenge(
    verifier: string,
    challenge: string,
    method: string,
  ): boolean {
    if (method !== 'S256') return false;

    const computed = crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64')
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(computed),
        Buffer.from(challenge),
      );
    } catch {
      return false;
    }
  }
}
