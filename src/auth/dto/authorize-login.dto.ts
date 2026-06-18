import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class AuthorizeLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  client_id: string;

  @IsString()
  redirect_uri: string;

  @IsString()
  @Length(43, 128)
  code_challenge: string;

  @IsIn(['S256'])
  code_challenge_method: 'S256';

  @IsString()
  @IsOptional()
  state?: string;
}
