import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

jest.mock('./auth.service.js', () => ({
  AuthService: jest.fn(),
}));

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { OAuthClientService } from './services/oauth-client.service.js';
import { SignupDto } from './dto/signup.dto.js';

const mockAuthService = {
  signup: jest.fn(),
};

const mockConfigService = { get: jest.fn() };
const mockOAuthClientService = { findById: jest.fn() };

const signupDto: SignupDto = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'secret123',
};

const serviceResponse = {
  id: 'uuid-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  createdAt: new Date(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: OAuthClientService, useValue: mockOAuthClientService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('delegates to AuthService and returns the result', async () => {
      mockAuthService.signup.mockResolvedValue(serviceResponse);

      const result = await controller.signup(signupDto);

      expect(mockAuthService.signup).toHaveBeenCalledWith(signupDto);
      expect(result).toEqual(serviceResponse);
    });
  });
});
