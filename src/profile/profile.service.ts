import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProfileDto) {
    const existing = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('Profile already exists');
    }

    return this.prisma.profile.create({
      data: { userId, ...dto },
      select: this.profileSelect(),
    });
  }

  async findOwn(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: this.profileSelect(),
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async update(userId: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundException('Profile not found — create one first');
    }

    return this.prisma.profile.update({
      where: { userId },
      data: dto,
      select: this.profileSelect(),
    });
  }

  private profileSelect() {
    return {
      id: true,
      age: true,
      gender: true,
      bloodGroup: true,
      maritalStatus: true,
      mobileNumber: true,
      createdAt: true,
      updatedAt: true,
    } as const;
  }
}
