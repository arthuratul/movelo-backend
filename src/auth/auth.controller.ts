import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthorizeDto } from './dto/authorize.dto';
import { LogoutDto } from './dto/logout.dto';
import { SignupDto } from './dto/signup.dto';
import { TokenDto } from './dto/token.dto';

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
  authorize(@Body() dto: AuthorizeDto) {
    return this.authService.authorize(dto);
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  token(@Body() dto: TokenDto) {
    return this.authService.exchangeToken(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.refresh_token);
  }
}
