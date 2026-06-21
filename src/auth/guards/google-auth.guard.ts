import {
  BadRequestException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { OAuthClientService } from '../services/oauth-client.service';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly oauthClientService: OAuthClientService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const { client_id, redirect_uri, code_challenge, code_challenge_method, state } =
      request.query as Record<string, string>;

    const client = await this.oauthClientService.findById(client_id ?? '');
    if (!client) throw new BadRequestException('Unknown client_id');
    if (!client.redirectUris.includes(redirect_uri)) {
      throw new BadRequestException('redirect_uri is not registered for this client');
    }

    const statePayload = {
      client_id,
      redirect_uri,
      code_challenge,
      code_challenge_method,
      ...(state ? { original_state: state } : {}),
    };

    (request as any)._googleState = Buffer.from(
      JSON.stringify(statePayload),
    ).toString('base64url');

    return super.canActivate(context) as Promise<boolean>;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    return { state: (request as any)._googleState };
  }
}
