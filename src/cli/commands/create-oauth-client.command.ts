import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CreateOAuthClientCommand {
  constructor(private readonly prisma: PrismaService) {}

  async run(name: string, clientId: string): Promise<void> {
    const existing = await this.prisma.oAuthClient.findUnique({
      where: { clientId },
    });

    if (existing) {
      console.error(`Error: client_id "${clientId}" already exists.`);
      process.exit(1);
    }

    const plainSecret = crypto.randomBytes(32).toString('hex');
    const hashedSecret = await bcrypt.hash(plainSecret, 10);

    await this.prisma.oAuthClient.create({
      data: { clientId, clientSecret: hashedSecret, name },
    });

    console.log('\nOAuth client created successfully.\n');
    console.log(`  name:          ${name}`);
    console.log(`  client_id:     ${clientId}`);
    console.log(`  client_secret: ${plainSecret}`);
    console.log('\n⚠  Store the client_secret now — it will not be shown again.\n');
  }
}