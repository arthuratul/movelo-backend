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
import type { UserModel } from '../../generated/prisma/models';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@AuthUser() user: UserModel, @Body() dto: CreateProfileDto) {
    return this.profileService.create(user.id, dto);
  }

  @Get('me')
  getMyProfile(@AuthUser() user: UserModel) {
    return this.profileService.findOwn(user.id);
  }

  @Patch('me')
  updateMyProfile(@AuthUser() user: UserModel, @Body() dto: UpdateProfileDto) {
    return this.profileService.update(user.id, dto);
  }
}
