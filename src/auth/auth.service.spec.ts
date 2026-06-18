import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

jest.mock('../prisma/prisma.service.js', () => ({
  PrismaService: jest.fn(),
}));
jest.mock('../mail/mail.service.js', () => ({
  MailService: jest.fn(),
}));

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import { AuthService } from './auth.service.js';
import { OAuthClientService } from './services/oauth-client.service.js';
import { SignupDto } from './dto/signup.dto.js';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockMailService = { sendConfirmationEmail: jest.fn() };
const mockJwtService = { sign: jest.fn() };
const mockConfigService = { get: jest.fn(), getOrThrow: jest.fn() };
const mockOAuthClientService = { findById: jest.fn() };

const signupDto: SignupDto = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'secret123',
};

const createdUser = {
  id: 'uuid-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  createdAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMailService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: OAuthClientService, useValue: mockOAuthClientService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('creates a user and returns them without the password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createdUser);
      mockMailService.sendConfirmationEmail.mockResolvedValue(undefined);

      const result = await service.signup(signupDto);

      expect(result).toEqual(createdUser);
      expect(result).not.toHaveProperty('password');
    });

    it('hashes the password before saving', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createdUser);
      mockMailService.sendConfirmationEmail.mockResolvedValue(undefined);

      await service.signup(signupDto);

      const createCalls = mockPrisma.user.create.mock.calls as Array<
        [{ data: { password: string } }]
      >;
      const savedPassword = createCalls[0][0].data.password;
      expect(savedPassword).not.toBe(signupDto.password);
      await expect(
        bcrypt.compare(signupDto.password, savedPassword),
      ).resolves.toBe(true);
    });

    it('throws ConflictException when email is already taken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(service.signup(signupDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('looks up the user by the provided email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createdUser);
      mockMailService.sendConfirmationEmail.mockResolvedValue(undefined);

      await service.signup(signupDto);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: signupDto.email },
      });
    });
  });
});
