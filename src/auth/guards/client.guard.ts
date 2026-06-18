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
    oauthClient?: { id: string; name: string };
  }
}

@Injectable()
export class ClientGuard implements CanActivate {
  constructor(private readonly oauthClientService: OAuthClientService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const { client_id, client_secret } = request.body as {
      client_id?: string;
      client_secret?: string;
    };

    const client = await this.oauthClientService.validateClient(
      client_id ?? '',
      client_secret ?? '',
    );

    if (!client) {
      throw new UnprocessableEntityException([
        {
          property: 'client',
          constraints: { client: 'Invalid client credentials' },
          children: [],
        },
      ]);
    }

    request.oauthClient = client;
    return true;
  }
}