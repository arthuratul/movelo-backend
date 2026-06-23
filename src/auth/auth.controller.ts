import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Redirect,
  Req,
  Res,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthUser } from './decorators/auth-user.decorator';
import { AuthorizeQueryDto } from './dto/authorize-query.dto';
import { LogoutDto } from './dto/logout.dto';
import { SignupDto } from './dto/signup.dto';
import { TokenDto } from './dto/token.dto';
import { ClientGuard } from './guards/client.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Controller({ path: 'auth', version: VERSION_NEUTRAL })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Get('verify-email')
  @Redirect()
  async verifyEmail(@Query('token') token: string) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    try {
      await this.authService.verifyEmail(token);
      return { url: `${frontendUrl}/email-verified` };
    } catch {
      return { url: `${frontendUrl}/email-verification-failed` };
    }
  }

  /**
   * Step 1 — Frontend redirects the browser here with PKCE params.
   * Validates the client and redirect_uri, then redirects to the
   * backend-hosted login page.
   */
  @Get('authorize')
  @Redirect()
  async authorize(@Query() dto: AuthorizeQueryDto) {
    const url = await this.authService.initiateAuthorization(dto);
    return { url };
  }

  /**
   * Step 2 — Backend-hosted login form.
   * Validates the params again (defence-in-depth), then renders the
   * HTML form. PKCE params ride as hidden fields — the frontend never
   * handles credentials.
   */
  @Get('login')
  async loginPage(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    const data = await this.authService.getLoginPageData({
      client_id: query['client_id'] ?? '',
      redirect_uri: query['redirect_uri'] ?? '',
    });

    if (!data) {
      return res.status(400).render('auth-error', {
        title: 'Authorization Error – Movelo',
        message: 'Invalid or expired authorization request.',
      });
    }

    return res.render('login', {
      title: `Sign in – ${data.clientName}`,
      client_id: query['client_id'] ?? '',
      redirect_uri: query['redirect_uri'] ?? '',
      code_challenge: query['code_challenge'] ?? '',
      code_challenge_method: query['code_challenge_method'] ?? '',
      state: query['state'] || null,
    });
  }

  /**
   * Step 3 — HTML form submission.
   * Validates credentials, creates the auth code, then 302-redirects
   * the browser to redirect_uri?code=...
   * On bad credentials: re-renders the form with an error message.
   */
  @Post('login')
  async loginSubmit(@Req() req: Request, @Res() res: Response) {
    const body = req.body as Record<string, string | undefined>;

    const params = {
      client_id: body['client_id'] ?? '',
      redirect_uri: body['redirect_uri'] ?? '',
      code_challenge: body['code_challenge'] ?? '',
      code_challenge_method: body['code_challenge_method'] ?? '',
      state: body['state'],
    };

    try {
      const redirectTo = await this.authService.processLogin({
        email: body['email'] ?? '',
        password: body['password'] ?? '',
        ...params,
      });
      return res.redirect(302, redirectTo);
    } catch (err) {
      if (err instanceof BadRequestException) {
        return res.status(400).render('auth-error', {
          title: 'Authorization Error – Movelo',
          message: 'Invalid authorization request.',
        });
      }

      const data = await this.authService.getLoginPageData({
        client_id: params.client_id,
        redirect_uri: params.redirect_uri,
      });

      if (!data) {
        return res.status(400).render('auth-error', {
          title: 'Authorization Error – Movelo',
          message: 'Invalid or expired authorization request.',
        });
      }

      const message =
        err instanceof ForbiddenException
          ? 'Your email address is not verified. Please check your inbox.'
          : 'Incorrect email or password.';

      return res.render('login', {
        title: `Sign in – ${data.clientName}`,
        ...params,
        error: message,
      });
    }
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClientGuard)
  token(@Body() dto: TokenDto, @Body('client_id') clientId: string) {
    return this.authService.exchangeToken(dto, clientId);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClientGuard, RefreshTokenGuard)
  refresh(
    @AuthUser() token: { id: string; userId: string; userEmail: string },
    @Body('client_id') clientId: string,
  ) {
    return this.authService.rotateRefreshToken(
      token.id,
      token.userId,
      token.userEmail,
      clientId,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.refresh_token);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // Passport redirects to Google — this handler body is never reached
  }

  @Get('google/callback')
  @Redirect()
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @AuthUser() user: { id: string },
    @Query('state') encodedState: string,
  ) {
    const pkce = JSON.parse(
      Buffer.from(encodedState, 'base64url').toString('utf-8'),
    ) as {
      client_id: string;
      redirect_uri: string;
      code_challenge: string;
      code_challenge_method: 'S256';
      original_state?: string;
    };

    const { redirect_to } = await this.authService.createAuthCode(
      user.id,
      pkce.client_id,
      {
        redirect_uri: pkce.redirect_uri,
        code_challenge: pkce.code_challenge,
        code_challenge_method: pkce.code_challenge_method,
        state: pkce.original_state,
      },
    );

    return { url: redirect_to };
  }
}
