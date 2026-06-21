import { Injectable } from '@nestjs/common';
import { Command, Option } from 'nestjs-command';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CreateOAuthClientCommand {
  constructor(private readonly prisma: PrismaService) {}

  @Command({
    command: 'oauth:create-client',
    describe: 'Create a new public OAuth client',
  })
  async run(
    @Option({
      name: 'name',
      describe: 'Client display name',
      type: 'string',
      required: true,
    })
    name: string,

    @Option({
      name: 'redirect-uri',
      describe: 'Allowed redirect URI (repeat for multiple)',
      type: 'string',
      required: true,
    })
    redirectUri: string | string[],
  ): Promise<void> {
    const redirectUris = Array.isArray(redirectUri)
      ? redirectUri
      : [redirectUri];

    const client = await this.prisma.oAuthClient.create({
      data: {
        name,
        clientType: 'PUBLIC',
        redirectUris,
      },
    });

    console.log('\nOAuth client created successfully.\n');
    console.log(`  name:          ${name}`);
    console.log(`  client_id:     ${client.id}`);
    console.log(`  redirect_uris: ${redirectUris.join(', ')}`);
    console.log('');
  }
}
