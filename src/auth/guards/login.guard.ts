import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class LoginGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const { email, password } = request.body as {
      email?: string;
      password?: string;
    };

    const user = await this.authService.validateCredentials(
      email ?? '',
      password ?? '',
    );

    if (!user) {
      throw new UnprocessableEntityException([
        {
          property: 'credentials',
          constraints: { credentials: 'Email or password is incorrect' },
          children: [],
        },
      ]);
    }

    request.user = user;
    return true;
  }
}