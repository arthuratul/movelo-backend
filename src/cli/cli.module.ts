import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommandModule } from 'nestjs-command';
import { PrismaModule } from '../prisma/prisma.module';
import { CreateOAuthClientCommand } from './commands/create-oauth-client.command';
import { GenerateKeysCommand } from './commands/generate-keys.command';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommandModule,
  ],
  providers: [CreateOAuthClientCommand, GenerateKeysCommand],
})
export class CliModule {}
