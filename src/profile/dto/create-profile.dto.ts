import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  BloodGroup,
  Gender,
  MaritalStatus,
} from '../../../generated/prisma/enums.js';

export class CreateProfileDto {
  @IsOptional()
  @IsInt({ message: 'age must be an integer' })
  @Min(1, { message: 'age must be at least 1' })
  @Max(120, { message: 'age must be at most 120' })
  age?: number;

  @IsOptional()
  @IsEnum(Gender, {
    message: 'gender must be MALE, FEMALE, OTHER, or PREFER_NOT_TO_SAY',
  })
  gender?: Gender;

  @IsOptional()
  @IsEnum(BloodGroup, {
    message:
      'bloodGroup must be one of: A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, AB_POSITIVE, AB_NEGATIVE, O_POSITIVE, O_NEGATIVE',
  })
  bloodGroup?: BloodGroup;

  @IsOptional()
  @IsEnum(MaritalStatus, {
    message:
      'maritalStatus must be SINGLE, MARRIED, DIVORCED, WIDOWED, or SEPARATED',
  })
  maritalStatus?: MaritalStatus;

  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'mobileNumber must be in E.164 format (e.g. +919876543210)',
  })
  mobileNumber?: string;
}
