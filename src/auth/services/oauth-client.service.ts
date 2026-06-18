import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ValidatedClient {
  id: string;
  name: string;
  redirectUris: string[];
}

@Injectable()
export class OAuthClientService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ValidatedClient | null> {
    const client = await this.prisma.oAuthClient.findUnique({
      where: { id },
    });

    if (!client) return null;

    return { id: client.id, name: client.name, redirectUris: client.redirectUris };
  }
}
