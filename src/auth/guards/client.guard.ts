import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Request } from 'express';
import { OAuthClientService } from '../services/oauth-client.service';

declare module 'express' {
  interface Request {
    oauthClient?: { id: string; name: string; redirectUris: string[] };
  }
}

@Injectable()
export class ClientGuard implements CanActivate {
  constructor(private readonly oauthClientService: OAuthClientService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const { client_id } = request.body as { client_id?: string };

    const client = await this.oauthClientService.findById(client_id ?? '');

    if (!client) {
      throw new UnprocessableEntityException([
        {
          property: 'client',
          constraints: { client: 'Invalid client' },
          children: [],
        },
      ]);
    }

    request.oauthClient = client;
    return true;
  }
}
