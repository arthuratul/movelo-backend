import { IsEmail, IsIn, IsString, Length, MinLength } from 'class-validator';

export class AuthorizeDto {
  @IsString()
  client_id: string;

  @IsString()
  client_secret: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @Length(43, 128)
  code_challenge: string;

  @IsIn(['S256'])
  code_challenge_method: 'S256';
}
