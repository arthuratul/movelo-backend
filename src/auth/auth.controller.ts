import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthUser } from './decorators/auth-user.decorator';
import { AuthorizeLoginDto } from './dto/authorize-login.dto';
import { AuthorizeQueryDto } from './dto/authorize-query.dto';
import { LogoutDto } from './dto/logout.dto';
import { SignupDto } from './dto/signup.dto';
import { TokenDto } from './dto/token.dto';
import { ClientGuard } from './guards/client.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { LoginGuard } from './guards/login.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Controller('auth')
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

  @Get('authorize')
  @Redirect()
  async authorize(@Query() dto: AuthorizeQueryDto) {
    const url = await this.authService.initiateAuthorization(dto);
    return { url };
  }

  @Post('authorize/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClientGuard, LoginGuard)
  authorizeLogin(
    @AuthUser() user: { userId: string; email: string; clientId: string },
    @Body() dto: AuthorizeLoginDto,
  ) {
    return this.authService.createAuthCode(user.userId, user.clientId, dto);
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClientGuard)
  token(
    @Body() dto: TokenDto,
    @Body('client_id') clientId: string,
  ) {
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
    // Passport redirects to Google — this handler is never actually reached
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
