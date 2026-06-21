import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: any, user: TUser, info: any): TUser {
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException('Token has expired');
    }
    if (info instanceof JsonWebTokenError) {
      throw new UnauthorizedException('Invalid token');
    }
    if (err || !user) {
      throw err ?? new UnauthorizedException();
    }
    return user;
  }
}
