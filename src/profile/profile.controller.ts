import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

interface JwtUser {
  userId: string;
  email: string;
}

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@AuthUser() user: JwtUser, @Body() dto: CreateProfileDto) {
    return this.profileService.create(user.userId, dto);
  }

  @Get('me')
  getMyProfile(@AuthUser() user: JwtUser) {
    return this.profileService.findOwn(user.userId);
  }

  @Patch('me')
  updateMyProfile(@AuthUser() user: JwtUser, @Body() dto: UpdateProfileDto) {
    return this.profileService.update(user.userId, dto);
  }
}