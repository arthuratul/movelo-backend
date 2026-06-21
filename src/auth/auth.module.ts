import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as fs from 'fs';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClientGuard } from './guards/client.guard';
import { LoginGuard } from './guards/login.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { OAuthClientService } from './services/oauth-client.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@Module({
  imports: [
    MailModule,
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        privateKey: fs.readFileSync(
          config.getOrThrow<string>('JWT_PRIVATE_KEY_PATH'),
        ),
        publicKey: fs.readFileSync(
          config.getOrThrow<string>('JWT_PUBLIC_KEY_PATH'),
        ),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: config.get<number>('JWT_ACCESS_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OAuthClientService,
    JwtStrategy,
    GoogleStrategy,
    ClientGuard,
    LoginGuard,
    RefreshTokenGuard,
    GoogleAuthGuard,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
