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
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthUser } from './decorators/auth-user.decorator';
import { AuthorizeDto } from './dto/authorize.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { SignupDto } from './dto/signup.dto';
import { TokenDto } from './dto/token.dto';
import { ClientGuard } from './guards/client.guard';
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

  @Post('authorize')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClientGuard, LoginGuard)
  authorize(
    @AuthUser() user: { userId: string; email: string; clientId: string },
    @Body() dto: AuthorizeDto,
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
}