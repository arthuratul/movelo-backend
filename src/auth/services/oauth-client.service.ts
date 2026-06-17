import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

export interface ValidatedClient {
  id: string;
  clientId: string;
  name: string;
}

@Injectable()
export class OAuthClientService {
  constructor(private readonly prisma: PrismaService) {}

  async validateClient(
    clientId: string,
    clientSecret: string,
  ): Promise<ValidatedClient | null> {
    const client = await this.prisma.oAuthClient.findUnique({
      where: { clientId },
    });

    if (!client) {
      return null;
    }

    const secretMatches = await bcrypt.compare(clientSecret, client.clientSecret);
    if (!secretMatches) {
      return null;
    }

    return { id: client.id, clientId: client.clientId, name: client.name };
  }
}