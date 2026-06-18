import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

export interface ValidatedClient {
  id: string;
  name: string;
}

@Injectable()
export class OAuthClientService {
  constructor(private readonly prisma: PrismaService) {}

  async validateClient(
    id: string,
    clientSecret: string,
  ): Promise<ValidatedClient | null> {
    const client = await this.prisma.oAuthClient.findUnique({
      where: { id },
    });

    if (!client) {
      return null;
    }

    const secretMatches = await bcrypt.compare(clientSecret, client.clientSecret);
    if (!secretMatches) {
      return null;
    }

    return { id: client.id, name: client.name };
  }
}