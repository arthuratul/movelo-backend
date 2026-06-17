import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const { refresh_token } = request.body as { refresh_token?: string };

    if (!refresh_token) {
      throw new UnprocessableEntityException([
        {
          property: 'refresh_token',
          constraints: { refresh_token: 'Refresh token is required' },
          children: [],
        },
      ]);
    }

    const tokenRecord = await this.authService.validateRefreshToken(
      refresh_token,
      request.oauthClient!.id,
    );

    if (!tokenRecord) {
      throw new UnprocessableEntityException([
        {
          property: 'refresh_token',
          constraints: {
            refresh_token: 'Refresh token is invalid or has expired',
          },
          children: [],
        },
      ]);
    }

    request.user = tokenRecord;
    return true;
  }
}